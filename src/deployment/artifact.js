import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const SKIP=new Set(['.git','node_modules','.codingvibes','coverage','data','.next','.turbo','.cache']);
const SECRET_FILE=/^(?:\.env(?:\..*)?|.*\.(?:pem|key|p12|pfx))$/i;
const FRAMEWORKS=[['next','nextjs'],['vite','vite'],['astro','astro'],['@sveltejs/kit','sveltekit'],['svelte','svelte'],['vue','vue'],['react','react'],['express','node'],['fastify','node'],['hono','hono']];
function walk(root,dir=root,out=[]){if(out.length>=15000)return out;for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(SKIP.has(e.name))continue;const full=path.join(dir,e.name),rel=path.relative(root,full).split(path.sep).join('/');if(e.isDirectory())walk(root,full,out);else if(e.isFile())out.push({path:rel,size:fs.statSync(full).size});if(out.length>=15000)break;}return out}
function pkg(root){const p=path.join(root,'package.json');try{return JSON.parse(fs.readFileSync(p,'utf8'))}catch{return null}}
function detectFramework(root,p){if(p?.dependencies||p?.devDependencies){const deps={...(p.dependencies||{}),...(p.devDependencies||{})};for(const [needle,name] of FRAMEWORKS)if(Object.keys(deps).some(d=>d===needle||d.startsWith(needle+'/')))return name}if(fs.existsSync(path.join(root,'index.html')))return 'static-html';return 'unknown'}
function packageManager(root){if(fs.existsSync(path.join(root,'pnpm-lock.yaml')))return'pnpm';if(fs.existsSync(path.join(root,'yarn.lock')))return'yarn';if(fs.existsSync(path.join(root,'bun.lockb'))||fs.existsSync(path.join(root,'bun.lock')))return'bun';return'npm'}
function outputDir(framework,root,p){const configured=p?.scripts?.build?null:null;if(framework==='vite'||framework==='astro'||framework==='sveltekit')return'dist';if(framework==='vue')return'dist';if(framework==='react'&&fs.existsSync(path.join(root,'build')))return'build';if(framework==='nextjs'&&fs.existsSync(path.join(root,'out')))return'out';return configured||''}
function envKeys(root){const f=path.join(root,'.env.example');if(!fs.existsSync(f))return[];return fs.readFileSync(f,'utf8').split(/\r?\n/).map(x=>x.trim()).filter(x=>x&&!x.startsWith('#')).map(x=>x.split('=',1)[0]).filter(k=>/^[A-Z_][A-Z0-9_]*$/i.test(k))}
export function inspectProjectArtifact(root){
 const abs=path.resolve(root),p=pkg(abs),files=walk(abs);const framework=detectFramework(abs,p),pm=packageManager(abs),buildCommand=p?.scripts?.build||null,devCommand=p?.scripts?.dev||p?.scripts?.start||null;
 const secrets=files.filter(x=>SECRET_FILE.test(path.basename(x.path))&&path.basename(x.path)!=='.env.example').map(x=>x.path);
 const required=framework==='static-html'?['index.html']:(fs.existsSync(path.join(abs,'package.json'))?['package.json']:[]);
 const missing=required.filter(x=>!fs.existsSync(path.join(abs,x)));
 const nodeVersion=String(p?.engines?.node||'').replace(/^[^0-9]*/,'').split(/[<>= ]/)[0]||null;
 const staticDeploy=!buildCommand&&['static-html','vite','react','vue','svelte','astro'].includes(framework)&&!fs.existsSync(path.join(abs,'app','server.js'));
 return {schema:'codingvibes.project-artifact.v1',root:abs,files,framework,language:framework==='static-html'?'html':'javascript',packageManager:pm,buildCommand,devCommand,outputDirectory:outputDir(framework,abs,p),nodeVersion,static:staticDeploy,server:!staticDeploy,environmentVariables:envKeys(abs),projectMetadata:{name:p?.name||path.basename(abs),version:p?.version||null},deploymentMetadata:{requiredFiles:required,missingFiles:missing,secrets,serverRequired:!staticDeploy,adminPortal:true,sourcePortable:true}};
}
export function materializePortable(root,target){
 const source=path.resolve(root),dest=path.resolve(target);fs.mkdirSync(dest,{recursive:true});
 for(const file of walk(source)){if(SECRET_FILE.test(path.basename(file.path))&&path.basename(file.path)!=='.env.example')continue;const out=path.join(dest,file.path);fs.mkdirSync(path.dirname(out),{recursive:true});fs.copyFileSync(path.join(source,file.path),out)}
 return dest;
}
export function artifactFingerprint(artifact){return crypto.createHash('sha256').update(JSON.stringify({...artifact,root:undefined})).digest('hex')}
