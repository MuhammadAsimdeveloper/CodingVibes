import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {zipDirectory} from './zip.js';

const exec=promisify(execFile);
const safeName=v=>String(v||'site').toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,48)||'codingvibes-site';
const cleanError=(e,secret='')=>String(e?.response?.error?.message||e?.response?.message||e?.message||e||'deployment_failed').split(secret||'\u0000').join('[redacted]').slice(0,1000);
async function jsonFetch(url,{token,method='GET',body,headers={}}={}){
 const r=await fetch(url,{method,headers:{accept:'application/json','content-type':'application/json',...(token?{authorization:'Bearer '+token}:{}),...headers},body:body===undefined?undefined:JSON.stringify(body)});
 const text=await r.text();let data={};try{data=text?JSON.parse(text):{}}catch{data={raw:text}};
 if(!r.ok)throw Object.assign(new Error(data?.error?.message||data?.message||('provider_http_'+r.status)),{status:r.status,response:data});
 return data;
}
function authRequired(provider){return Object.assign(new Error(provider+'_not_connected'),{code:'PROVIDER_NOT_CONNECTED',status:409})}
function ensureStatic(artifact,provider){if(artifact.deploymentMetadata.serverRequired)throw Object.assign(new Error(provider+' direct publishing is not available for server-required projects. Export the complete project or use a Node/shared-host adapter.'),{code:'SERVER_RUNTIME_REQUIRED',status:409});}
async function gitEnv(token){return {...process.env,GIT_TERMINAL_PROMPT:'0',GIT_CONFIG_COUNT:'1',GIT_CONFIG_KEY_0:'http.https://github.com/.extraheader',GIT_CONFIG_VALUE_0:'AUTHORIZATION: basic '+Buffer.from('x-access-token:'+token).toString('base64')}}

async function githubApi(pathname,{token,method='GET',body}={}){return jsonFetch('https://api.github.com'+pathname,{token,method,body,headers:{'X-GitHub-Api-Version':'2026-03-10'}})}
export const PROVIDERS={
 github:{id:'github',label:'GitHub',type:'source',auth:'oauth',supports:{static:true,server:true},description:'Create or update a GitHub repository with the portable project source.',
  async deploy({artifact,credentials,options={}}){
   const token=credentials?.accessToken;if(!token)throw authRequired('github');const user=await githubApi('/user',{token});const owner=user.login,repo=safeName(options.repoName||artifact.projectMetadata.name),branch=String(options.branch||'main').replace(/[^A-Za-z0-9._/-]/g,'-').slice(0,120)||'main';
   let existing;try{existing=await githubApi('/repos/'+encodeURIComponent(owner)+'/'+encodeURIComponent(repo),{token})}catch{}
   if(!existing)existing=await githubApi('/user/repos',{token,method:'POST',body:{name:repo,private:options.private!==false,description:'Generated with Coding Vibes',auto_init:false}});
   const temp=fs.mkdtempSync(path.join(process.cwd(),'data','deploy-tmp-'));try{
     const filesDir=path.join(temp,'site');fs.mkdirSync(filesDir,{recursive:true});
     for(const f of artifact.files){const from=path.join(artifact.root,f.path),to=path.join(filesDir,f.path);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to);}
     const env=await gitEnv(token);await exec('git',['init'],{cwd:filesDir,env});await exec('git',['checkout','-b',branch],{cwd:filesDir,env});await exec('git',['config','user.name',user.name||owner],{cwd:filesDir,env});await exec('git',['config','user.email',user.email||owner+'@users.noreply.github.com'],{cwd:filesDir,env});await exec('git',['add','--all'],{cwd:filesDir,env});
     const status=await exec('git',['status','--porcelain'],{cwd:filesDir,env});if(!String(status.stdout||'').trim())return{status:'unchanged',deploymentId:existing.id,url:existing.html_url,branch,providerProject:existing.full_name};
     await exec('git',['commit','-m',String(options.commitMessage||'Publish from Coding Vibes').slice(0,160)],{cwd:filesDir,env});
     await exec('git',['remote','add','origin','https://github.com/'+owner+'/'+repo+'.git'],{cwd:filesDir,env});
     try{await exec('git',['push','-u','origin','HEAD:'+branch],{cwd:filesDir,env,timeout:180000})}catch(e){throw new Error('GitHub push failed: '+cleanError(e,token))}
     const commit=(await exec('git',['rev-parse','HEAD'],{cwd:filesDir,env})).stdout.trim();return{status:'published',deploymentId:repo,url:existing.html_url,branch,commitSha:commit,providerProject:owner+'/'+repo};
   }finally{try{fs.rmSync(temp,{recursive:true,force:true})}catch{}}
  },
  status:async({credentials,deploymentId})=>credentials?.accessToken?{status:'connected',deploymentId:deploymentId||null}:authRequired('github')
 },
 vercel:{id:'vercel',label:'Vercel',type:'deployment',auth:'token-or-oauth',supports:{static:true,server:false},description:'Deploy static-compatible projects through Vercel REST.',
  async deploy({artifact,credentials,options={}}){
   const token=credentials?.accessToken;if(!token)throw authRequired('vercel');ensureStatic(artifact,'Vercel');const files=[];
   for(const f of artifact.files){const data=fs.readFileSync(path.join(artifact.root,f.path)),digest=crypto.createHash('sha1').update(f.path).digest('hex');const up=await fetch('https://api.vercel.com/v2/files',{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/octet-stream','x-vercel-digest':digest},body:data});if(!up.ok&&up.status!==200)throw new Error('Vercel file upload failed for '+f.path);files.push({file:f.path,sha:digest,size:data.length});}
   const data=await jsonFetch('https://api.vercel.com/v13/deployments',{token,method:'POST',body:{name:safeName(options.projectName||artifact.projectMetadata.name),files,projectSettings:{framework:artifact.framework==='static-html'?null:artifact.framework,buildCommand:artifact.buildCommand||undefined,outputDirectory:artifact.outputDirectory||undefined},target:options.target||'production',meta:{codingvibesArtifact:'v1'}}});
   return{status:data.readyState||'published',deploymentId:data.id,url:data.url?(data.url.startsWith('http')?data.url:'https://'+data.url):null,commitSha:options.commitSha||null,providerProject:data.projectId||data.name};
  },
  status:async({credentials,deploymentId})=>{if(!credentials?.accessToken)throw authRequired('vercel');const d=await jsonFetch('https://api.vercel.com/v13/deployments/'+encodeURIComponent(deploymentId),{token:credentials.accessToken});return{status:d.readyState||d.state||'unknown',url:d.url?(d.url.startsWith('http')?d.url:'https://'+d.url):null,deploymentId:d.id}}
 },
 netlify:{id:'netlify',label:'Netlify',type:'deployment',auth:'token-or-oauth',supports:{static:true,server:false},description:'Deploy static-compatible project ZIPs through Netlify.',
  async deploy({artifact,credentials,options={}}){
   const token=credentials?.accessToken;if(!token)throw authRequired('netlify');ensureStatic(artifact,'Netlify');const temp=fs.mkdtempSync(path.join(process.cwd(),'data','netlify-deploy-'));try{
    const zip=path.join(temp,'site.zip');zipDirectory(artifact.root,zip);const body=fs.readFileSync(zip);const r=await fetch('https://api.netlify.com/api/v1/sites',{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/zip'},body});const text=await r.text();let data={};try{data=text?JSON.parse(text):{}}catch{}if(!r.ok)throw new Error(data?.message||'Netlify site creation failed');return{status:data.state||'published',deploymentId:data.id,url:data.ssl_url||data.url||null,providerProject:data.name||data.id};
   }finally{try{fs.rmSync(temp,{recursive:true,force:true})}catch{}}
  },
  status:async({credentials,deploymentId})=>{if(!credentials?.accessToken)throw authRequired('netlify');const d=await jsonFetch('https://api.netlify.com/api/v1/deploys/'+encodeURIComponent(deploymentId),{token:credentials.accessToken});return{status:d.state||'unknown',url:d.ssl_url||d.url||null,deploymentId:d.id}}
 },
 cloudflare:{id:'cloudflare',label:'Cloudflare Pages',type:'deployment',auth:'token-or-oauth',supports:{static:true,server:false},description:'Deploy static-compatible assets through Cloudflare Pages Direct Upload.',
  async deploy({artifact,credentials,options={}}){
   const token=credentials?.accessToken,accountId=credentials?.accountId||options.accountId;if(!token||!accountId)throw authRequired('cloudflare');ensureStatic(artifact,'Cloudflare Pages');const name=safeName(options.projectName||artifact.projectMetadata.name);
   try{await jsonFetch('https://api.cloudflare.com/client/v4/accounts/'+accountId+'/pages/projects/'+name,{token})}catch{await jsonFetch('https://api.cloudflare.com/client/v4/accounts/'+accountId+'/pages/projects',{token,method:'POST',body:{name,production_branch:String(options.branch||'main')}})}
   const manifest={};for(const f of artifact.files){const bytes=fs.readFileSync(path.join(artifact.root,f.path));manifest[f.path]=crypto.createHash('sha256').update(bytes).digest('hex');}
   const form=new FormData();form.set('manifest',JSON.stringify(manifest));form.set('branch',String(options.branch||'main'));form.set('commit_dirty','false');form.set('commit_message',String(options.commitMessage||'Publish from Coding Vibes'));if(options.commitSha)form.set('commit_hash',options.commitSha);
   const d=await fetch('https://api.cloudflare.com/client/v4/accounts/'+accountId+'/pages/projects/'+name+'/deployments',{method:'POST',headers:{authorization:'Bearer '+token},body:form});const text=await d.text();let data={};try{data=text?JSON.parse(text):{}}catch{}if(!d.ok||data.success===false)throw new Error(data?.errors?.[0]?.message||'Cloudflare Pages deployment creation failed');
   return{status:data.result?.latest_stage?.status||'queued',deploymentId:data.result?.id||data.result?.short_id||null,url:data.result?.aliases?.[0]||null,providerProject:name};
  },
  status:async({credentials,options={},deploymentId})=>{if(!credentials?.accessToken||!credentials?.accountId||!options.projectName)throw authRequired('cloudflare');const d=await jsonFetch('https://api.cloudflare.com/client/v4/accounts/'+credentials.accountId+'/pages/projects/'+encodeURIComponent(options.projectName)+'/deployments/'+encodeURIComponent(deploymentId),{token:credentials.accessToken});return{status:d.result?.latest_stage?.status||'unknown',url:d.result?.aliases?.[0]||null,deploymentId:d.result?.id}}
 },
 'coding-vibes':{id:'coding-vibes',label:'Coding Vibes Hosting',type:'deployment',auth:'internal',supports:{static:true,server:true},description:'Future provider slot for Coding Vibes-managed hosting.',
  async deploy(){if(!process.env.CODINGVIBES_HOSTING_API_URL)throw Object.assign(new Error('Coding Vibes hosting is not available yet. The adapter is ready for the future hosting service.'),{code:'HOSTING_NOT_AVAILABLE',status:503});throw new Error('Coding Vibes hosting API is not configured for deployment yet.')},
  status:async()=>({status:'not_available'})
 },
 manual:{id:'manual',label:'Download ZIP / Other Hosting',type:'export',auth:'none',supports:{static:true,server:true},description:'Export a validated portable project ZIP for any compatible host.',
  async deploy({artifact}){const out=path.resolve(process.env.CODINGVIBES_EXPORT_ROOT||path.join(process.cwd(),'data','exports'),safeName(artifact.projectMetadata.name)+'-'+Date.now()+'.zip');return{status:'ready',deploymentId:out,url:null,file:zipDirectory(artifact.root,out)}},
  status:async({deploymentId})=>({status:'ready',file:deploymentId})
 }
};
export function getProvider(id){return PROVIDERS[String(id||'').toLowerCase()]||null}
export function listProviders(){return Object.values(PROVIDERS).map(p=>({id:p.id,label:p.label,type:p.type,auth:p.auth,supports:p.supports,description:p.description}))}
