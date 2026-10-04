import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const MAX_BYTES=Number(process.env.CODINGVIBES_OBJECT_MAX_BYTES||500*1024*1024);
const SAFE=/^[a-zA-Z0-9._\/-]+$/;
function safeKey(key){const value=String(key||'').replace(/^\/+/, '');if(!value||value.length>500||value.includes('..')||!SAFE.test(value))throw new Error('invalid_object_key');return value;}
function digest(buffer){return crypto.createHash('sha256').update(buffer).digest('hex');}
function sizeGuard(buffer){if(buffer.byteLength>MAX_BYTES)throw new Error('object_too_large');}

export function createLocalObjectStore(root=process.env.CODINGVIBES_OBJECT_ROOT||'./data/objects'){
 const base=path.resolve(root);fs.mkdirSync(base,{recursive:true});
 const resolve=(key)=>{const target=path.resolve(base,safeKey(key));if(target!==base&&!target.startsWith(base+path.sep))throw new Error('object_path_escape');return target;};
 return {
  provider:'local',
  async put({key,body,contentType='application/octet-stream',metadata={}}={}){const buffer=Buffer.isBuffer(body)?body:Buffer.from(body||'');sizeGuard(buffer);const target=resolve(key);fs.mkdirSync(path.dirname(target),{recursive:true});const tmp=target+'.tmp-'+process.pid+'-'+Date.now();fs.writeFileSync(tmp,buffer);fs.renameSync(tmp,target);return {key:safeKey(key),size:buffer.length,sha256:digest(buffer),contentType,metadata};},
  async get({key}={}){const target=resolve(key);if(!fs.existsSync(target))return null;const body=fs.readFileSync(target);return {key:safeKey(key),body,size:body.length,sha256:digest(body)};},
  async head({key}={}){const target=resolve(key);if(!fs.existsSync(target))return null;const stat=fs.statSync(target);return {key:safeKey(key),size:stat.size,updatedAt:stat.mtime.toISOString()};},
  async delete({key}={}){const target=resolve(key);if(fs.existsSync(target))fs.rmSync(target,{force:true});return {deleted:true,key:safeKey(key)};},
  async healthcheck(){try{fs.accessSync(base,fs.constants.R_OK|fs.constants.W_OK);return true;}catch{return false;}}
 };
}

export async function createS3ObjectStore(options={}){
 const [{S3Client,PutObjectCommand,GetObjectCommand,HeadObjectCommand,DeleteObjectCommand}]=await Promise.all([import('@aws-sdk/client-s3')]);
 const bucket=String(options.bucket||process.env.CODINGVIBES_OBJECT_BUCKET||'').trim();
 const region=String(options.region||process.env.CODINGVIBES_OBJECT_REGION||'us-east-1').trim();
 if(!bucket)throw new Error('CODINGVIBES_OBJECT_BUCKET is required for S3 object storage');
 const endpoint=String(options.endpoint||process.env.CODINGVIBES_OBJECT_ENDPOINT||'').trim()||undefined;
 const client=new S3Client({region,endpoint,forcePathStyle:Boolean(endpoint),maxAttempts:3});
 async function bodyBuffer(stream){if(stream?.transformToByteArray)return Buffer.from(await stream.transformToByteArray());const chunks=[];for await(const chunk of stream||[])chunks.push(Buffer.from(chunk));const buffer=Buffer.concat(chunks);sizeGuard(buffer);return buffer;}
 return {
  provider:'s3',bucket,region,endpoint,
  async put({key,body,contentType='application/octet-stream',metadata={}}={}){const buffer=Buffer.isBuffer(body)?body:Buffer.from(body||'');sizeGuard(buffer);const objectKey=safeKey(key);const normalized=Object.fromEntries(Object.entries(metadata).map(([k,v])=>[String(k).toLowerCase(),String(v)]));await client.send(new PutObjectCommand({Bucket:bucket,Key:objectKey,Body:buffer,ContentType:contentType,Metadata:normalized}));return {key:objectKey,size:buffer.length,sha256:digest(buffer),contentType,metadata:normalized};},
  async get({key}={}){const objectKey=safeKey(key);try{const result=await client.send(new GetObjectCommand({Bucket:bucket,Key:objectKey}));const body=await bodyBuffer(result.Body);return {key:objectKey,body,size:body.length,sha256:digest(body),contentType:result.ContentType||null,metadata:result.Metadata||{}};}catch(error){if(error?.$metadata?.httpStatusCode===404||error?.name==='NoSuchKey')return null;throw error;}},
  async head({key}={}){const objectKey=safeKey(key);try{const result=await client.send(new HeadObjectCommand({Bucket:bucket,Key:objectKey}));return {key:objectKey,size:Number(result.ContentLength||0),etag:result.ETag||null,contentType:result.ContentType||null,metadata:result.Metadata||{}};}catch(error){if(error?.$metadata?.httpStatusCode===404||error?.name==='NotFound')return null;throw error;}},
  async delete({key}={}){const objectKey=safeKey(key);await client.send(new DeleteObjectCommand({Bucket:bucket,Key:objectKey}));return {deleted:true,key:objectKey};},
  async healthcheck(){try{await client.send(new HeadObjectCommand({Bucket:bucket,Key:'__codingvibes_healthcheck__'}));return true;}catch(error){return error?.$metadata?.httpStatusCode===404;}}
 };
}

export async function createObjectStore(options={}){const backend=String(options.backend||process.env.CODINGVIBES_OBJECT_BACKEND||'local').toLowerCase();if(backend==='s3')return createS3ObjectStore(options);if(backend!=='local')throw new Error('unsupported_object_storage_backend');return createLocalObjectStore(options.root);}