import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {zipDirectory} from './zip.js';
import {createOptimizedExportWorkspace} from './media-optimizer.js';

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
function contentTypeFor(file){const e=path.extname(file).toLowerCase();return({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.avif':'image/avif','.gif':'image/gif','.bmp':'image/bmp','.ico':'image/x-icon','.mp4':'video/mp4','.m4v':'video/x-m4v','.mov':'video/quicktime','.webm':'video/webm','.mp3':'audio/mpeg','.m4a':'audio/mp4','.aac':'audio/aac','.ogg':'audio/ogg','.opus':'audio/opus','.pdf':'application/pdf','.woff':'font/woff','.woff2':'font/woff2'})[e]||'application/octet-stream'}
function ensureStatic(artifact,provider){if(artifact.deploymentMetadata.serverRequired)throw Object.assign(new Error(provider+' direct publishing is not available for server-required projects. Export the complete project or use a Node/shared-host adapter.'),{code:'SERVER_RUNTIME_REQUIRED',status:409});}
async function gitEnv(token){return {...process.env,GIT_TERMINAL_PROMPT:'0',GIT_CONFIG_COUNT:'1',GIT_CONFIG_KEY_0:'http.https://github.com/.extraheader',GIT_CONFIG_VALUE_0:'AUTHORIZATION: basic '+Buffer.from('x-access-token:'+token).toString('base64')}}

async function githubApi(pathname,{token,method='GET',body}={}){return jsonFetch('https://api.github.com'+pathname,{token,method,body,headers:{'X-GitHub-Api-Version':'2026-03-10'}})}
export const PROVIDERS={
 github:{id:'github',label:'GitHub',type:'source',auth:'oauth',supports:{static:true,server:true},description:'Create or update a GitHub repository with the portable project source.',
  async deploy({artifact,credentials,options={}}){
   const token=credentials?.accessToken;if(!token)throw authRequired('github');const user=await githubApi('/user',{token});const owner=user.login,repo=safeName(options.repoName||artifact.projectMetadata.name),branch=String(options.branch||'main').replace(/[^A-Za-z0-9._/-]/g,'-').slice(0,120)||'main';
   let existing=null;let created=false;try{existing=await githubApi('/repos/'+encodeURIComponent(owner)+'/'+encodeURIComponent(repo),{token})}catch{}
   if(!existing){existing=await githubApi('/user/repos',{token,method:'POST',body:{name:repo,private:options.private!==false,description:'Generated with Coding Vibes',auto_init:false}});created=true;}
   const temp=fs.mkdtempSync(path.join(process.cwd(),'data','deploy-tmp-'));let workspace;
   try{
     workspace=await createOptimizedExportWorkspace(artifact);
     const filesDir=path.join(temp,'site');const env=await gitEnv(token);
     if(existing?.id&&!created){await exec('git',['clone','--depth','1','--single-branch','--branch',branch,'https://github.com/'+owner+'/'+repo+'.git',filesDir],{cwd:temp,env,timeout:180000}).catch(async()=>{await exec('git',['clone','--depth','1','https://github.com/'+owner+'/'+repo+'.git',filesDir],{cwd:temp,env,timeout:180000});await exec('git',['checkout','-B',branch],{cwd:filesDir,env})})}
     else {fs.mkdirSync(filesDir,{recursive:true});await exec('git',['init'],{cwd:filesDir,env});await exec('git',['checkout','-b',branch],{cwd:filesDir,env})}
     const gitFiles=fs.readdirSync(filesDir,{withFileTypes:true}).filter(e=>e.name!=='.git');for(const e of gitFiles){fs.rmSync(path.join(filesDir,e.name),{recursive:true,force:true})}
     for(const f of workspace.files){const from=path.join(workspace.root,f.path),to=path.join(filesDir,f.path);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to)}
     await exec('git',['config','user.name',user.name||owner],{cwd:filesDir,env});await exec('git',['config','user.email',user.email||owner+'@users.noreply.github.com'],{cwd:filesDir,env});await exec('git',['add','--all'],{cwd:filesDir,env});
     const status=await exec('git',['status','--porcelain'],{cwd:filesDir,env});if(!String(status.stdout||'').trim())return{status:'unchanged',deploymentId:existing.id,url:existing.html_url,branch,providerProject:existing.full_name,optimization:workspace.report};
     await exec('git',['commit','-m',String(options.commitMessage||'Publish from Coding Vibes').slice(0,160)],{cwd:filesDir,env});if(created)await exec('git',['remote','add','origin','https://github.com/'+owner+'/'+repo+'.git'],{cwd:filesDir,env});
     try{await exec('git',['push','-u','origin','HEAD:'+branch],{cwd:filesDir,env,timeout:180000})}catch(e){throw new Error('GitHub push failed: '+cleanError(e,token))}
     const commit=(await exec('git',['rev-parse','HEAD'],{cwd:filesDir,env})).stdout.trim();return{status:'published',deploymentId:repo,url:existing.html_url,branch,commitSha:commit,providerProject:owner+'/'+repo,optimization:workspace.report};
   }finally{workspace?.cleanup();try{fs.rmSync(temp,{recursive:true,force:true})}catch{}}
  },
  status:async({credentials,deploymentId})=>credentials?.accessToken?{status:'connected',deploymentId:deploymentId||null}:authRequired('github')
 },
 vercel:{id:'vercel',label:'Vercel',type:'deployment',auth:'token-or-oauth',supports:{static:true,server:false},description:'Deploy static-compatible projects through Vercel REST.',
  async deploy({artifact,credentials,options={}}){
   const token=credentials?.accessToken;if(!token)throw authRequired('vercel');ensureStatic(artifact,'Vercel');
   const workspace=await createOptimizedExportWorkspace(artifact);
   try{
    const files=[];
    for(const f of workspace.files){const data=fs.readFileSync(path.join(workspace.root,f.path)),digest=crypto.createHash('sha1').update(data).digest('hex');const up=await fetch('https://api.vercel.com/v2/files',{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/octet-stream','x-vercel-digest':digest},body:data});if(!up.ok&&up.status!==200)throw new Error('Vercel file upload failed for '+f.path);files.push({file:f.path,sha:digest,size:data.length});}
    const data=await jsonFetch('https://api.vercel.com/v13/deployments',{token,method:'POST',body:{name:safeName(options.projectName||artifact.projectMetadata.name),files,projectSettings:{framework:artifact.framework==='static-html'?null:artifact.framework,buildCommand:artifact.buildCommand||undefined,outputDirectory:artifact.outputDirectory||undefined},target:options.target||'production',meta:{codingvibesArtifact:'v1'}}});
    return{status:data.readyState||'published',deploymentId:data.id,url:data.url?(data.url.startsWith('http')?data.url:'https://'+data.url):null,commitSha:options.commitSha||null,providerProject:data.projectId||data.name,optimization:workspace.report};
   }finally{workspace.cleanup();}
  },
  status:async({credentials,deploymentId})=>{if(!credentials?.accessToken)throw authRequired('vercel');const d=await jsonFetch('https://api.vercel.com/v13/deployments/'+encodeURIComponent(deploymentId),{token:credentials.accessToken});return{status:d.readyState||d.state||'unknown',url:d.url?(d.url.startsWith('http')?d.url:'https://'+d.url):null,deploymentId:d.id}}
 },
 netlify:{id:'netlify',label:'Netlify',type:'deployment',auth:'token-or-oauth',supports:{static:true,server:false},description:'Deploy static-compatible project ZIPs through Netlify.',
  async deploy({artifact,credentials,options={}}){
   const token=credentials?.accessToken;if(!token)throw authRequired('netlify');ensureStatic(artifact,'Netlify');
   const created=await jsonFetch('https://api.netlify.com/api/v1/sites',{token,method:'POST',body:{name:safeName(options.siteName||artifact.projectMetadata.name)}});
   const siteId=created.id;if(!siteId)throw new Error('Netlify did not return a site id');
   const temp=fs.mkdtempSync(path.join(process.cwd(),'data','netlify-deploy-'));let workspace;
   try{workspace=await createOptimizedExportWorkspace(artifact);const zip=path.join(temp,'site.zip');zipDirectory(workspace.root,zip);const body=fs.readFileSync(zip);const r=await fetch('https://api.netlify.com/api/v1/sites/'+encodeURIComponent(siteId)+'/deploys',{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/zip','content-length':String(body.length)},body});const text=await r.text();let data={};try{data=text?JSON.parse(text):{}}catch{}if(!r.ok)throw new Error(data?.message||'Netlify deploy failed');return{status:data.state||'published',deploymentId:data.id||siteId,url:data.ssl_url||data.url||created.ssl_url||created.url||null,providerProject:created.name||siteId,optimization:workspace.report};}
   finally{workspace?.cleanup();try{fs.rmSync(temp,{recursive:true,force:true})}catch{}}
  },
  status:async({credentials,deploymentId})=>{if(!credentials?.accessToken)throw authRequired('netlify');const d=await jsonFetch('https://api.netlify.com/api/v1/deploys/'+encodeURIComponent(deploymentId),{token:credentials.accessToken});return{status:d.state||'unknown',url:d.ssl_url||d.url||null,deploymentId:d.id}}
 },
 cloudflare:{id:'cloudflare',label:'Cloudflare Pages',type:'deployment',auth:'token-or-oauth',supports:{static:true,server:false},description:'Deploy static-compatible assets through Cloudflare Pages Direct Upload.',
  async deploy({artifact,credentials,options={}}){
   const token=credentials?.accessToken,accountId=credentials?.accountId||options.accountId;if(!token||!accountId)throw authRequired('cloudflare');ensureStatic(artifact,'Cloudflare Pages');const name=safeName(options.projectName||artifact.projectMetadata.name);
   try{await jsonFetch('https://api.cloudflare.com/client/v4/accounts/'+accountId+'/pages/projects/'+name,{token})}catch{await jsonFetch('https://api.cloudflare.com/client/v4/accounts/'+accountId+'/pages/projects',{token,method:'POST',body:{name,production_branch:String(options.branch||'main')}})}
   const tokenResponse=await jsonFetch('https://api.cloudflare.com/client/v4/accounts/'+accountId+'/pages/projects/'+encodeURIComponent(name)+'/upload-token',{token});const uploadToken=tokenResponse.result?.jwt||tokenResponse.result?.token;if(!uploadToken)throw new Error('Cloudflare did not return an upload token');
   const workspace=await createOptimizedExportWorkspace(artifact);
   try{
    const manifest={};const assets=[];
    for(const f of workspace.files){const bytes=fs.readFileSync(path.join(workspace.root,f.path));if(bytes.length>25*1024*1024)throw Object.assign(new Error('Cloudflare Pages direct upload rejected '+f.path+': file exceeds the 25 MiB limit.'),{code:'CLOUDFLARE_FILE_TOO_LARGE',status:413});const hash=crypto.createHash('sha256').update(bytes).digest('hex');manifest[f.path]=hash;assets.push({key:hash,value:bytes.toString('base64'),base64:true,metadata:{contentType:contentTypeFor(f.path)}});}
    for(let i=0;i<assets.length;i+=20){const batch=assets.slice(i,i+20);const up=await fetch('https://api.cloudflare.com/client/v4/pages/assets/upload',{method:'POST',headers:{authorization:'Bearer '+uploadToken,'content-type':'application/json'},body:JSON.stringify(batch)});const ut=await up.text();let ud={};try{ud=ut?JSON.parse(ut):{}}catch{}if(!up.ok||ud.success===false)throw new Error(ud?.errors?.[0]?.message||'Cloudflare asset upload failed');}
    const form=new FormData();form.set('manifest',JSON.stringify(manifest));form.set('branch',String(options.branch||'main'));form.set('commit_dirty','false');form.set('commit_message',String(options.commitMessage||'Publish from Coding Vibes'));if(options.commitSha)form.set('commit_hash',options.commitSha);
    const d=await fetch('https://api.cloudflare.com/client/v4/accounts/'+accountId+'/pages/projects/'+name+'/deployments',{method:'POST',headers:{authorization:'Bearer '+token},body:form});const text=await d.text();let data={};try{data=text?JSON.parse(text):{}}catch{}if(!d.ok||data.success===false)throw new Error(data?.errors?.[0]?.message||'Cloudflare Pages deployment creation failed');
    return{status:data.result?.latest_stage?.status||'queued',deploymentId:data.result?.id||data.result?.short_id||null,url:data.result?.aliases?.[0]||null,providerProject:name,optimization:workspace.report};
   }finally{workspace.cleanup();}
  },
  status:async({credentials,options={},deploymentId})=>{if(!credentials?.accessToken||!credentials?.accountId||!options.projectName)throw authRequired('cloudflare');const d=await jsonFetch('https://api.cloudflare.com/client/v4/accounts/'+credentials.accountId+'/pages/projects/'+encodeURIComponent(options.projectName)+'/deployments/'+encodeURIComponent(deploymentId),{token:credentials.accessToken});return{status:d.result?.latest_stage?.status||'unknown',url:d.result?.aliases?.[0]||null,deploymentId:d.result?.id}}
 },
 hostinger:{id:'hostinger',label:'Hostinger',type:'hosting-assist',auth:'github',supports:{static:true,server:true},description:'Prepare a verified project for Hostinger by publishing it to GitHub, then connect that repository in Hostinger Node.js Web Apps. Direct Hostinger deployment API access is not assumed.',
  async deploy({artifact,credentials,options={}}){
    if(!credentials?.accessToken)throw authRequired('hostinger');
    const result=await PROVIDERS.github.deploy({artifact,credentials,options:{...options,repoName:options.repoName||artifact.projectMetadata.name,branch:options.branch||'main'}});
    return {status:'ready_for_hostinger',deploymentId:result.deploymentId,url:result.url,branch:result.branch,commitSha:result.commitSha,providerProject:result.providerProject,optimization:result.optimization||null,nextStep:'In Hostinger: Websites → Add Website → Node.js Web App → Import Git Repository, select the repository and deploy.'};
  },
  status:async({credentials,deploymentId})=>credentials?.accessToken?{status:'ready_for_hostinger',deploymentId:deploymentId||null,nextStep:'Connect the published GitHub repository from Hostinger Node.js Web Apps and deploy.'}:authRequired('hostinger')
 },
 'coding-vibes':{id:'coding-vibes',label:'Build Vibe Cloud Hosting',type:'deployment',auth:'internal',supports:{static:true,server:true},description:'First-party hosting adapter for verified Build Vibe artifacts.',
  async deploy({artifact,options={}}){
    const base=String(process.env.CODINGVIBES_HOSTING_API_URL||process.env.CODINGVIBES_CLOUD_API_URL||'').replace(/\/$/,'');
    const token=process.env.CODINGVIBES_HOSTING_API_KEY||process.env.CODINGVIBES_CLOUD_API_KEY;
    if(!base)throw Object.assign(new Error('Build Vibe Cloud hosting is not configured.'),{code:'HOSTING_NOT_AVAILABLE',status:503});
    const tmp=fs.mkdtempSync(path.join(process.cwd(),'data','cloud-deploy-'));let workspace;
    try{
      workspace=await createOptimizedExportWorkspace(artifact);
      const zip=path.join(tmp,'artifact.zip');zipDirectory(workspace.root,zip);const bytes=fs.readFileSync(zip);
      if(bytes.length>100*1024*1024)throw Object.assign(new Error('Cloud deployment artifact exceeds 100 MiB.'),{code:'HOSTING_ARTIFACT_TOO_LARGE',status:413});
      const response=await fetch(base+'/deploy',{method:'POST',headers:{'content-type':'application/json',accept:'application/json',...(token?{authorization:'Bearer '+token}: {})},body:JSON.stringify({project:artifact.projectMetadata,name:safeName(options.projectName||artifact.projectMetadata.name),framework:artifact.framework,fingerprint:artifact.fingerprint||null,fileName:path.basename(zip),artifactBase64:bytes.toString('base64'),target:options.target||'production'})});
      const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data?.error||'Build Vibe Cloud deploy failed');
      return{status:data.status||'published',deploymentId:data.id||data.deploymentId||null,url:data.url||null,providerProject:data.projectId||data.project||null,nextStep:data.nextStep||null,optimization:workspace.report};
    }finally{workspace?.cleanup();try{fs.rmSync(tmp,{recursive:true,force:true})}catch{}}
  },
  status:async({credentials,deploymentId})=>{
    const base=String(process.env.CODINGVIBES_HOSTING_API_URL||process.env.CODINGVIBES_CLOUD_API_URL||'').replace(/\/$/,'');const token=process.env.CODINGVIBES_HOSTING_API_KEY||process.env.CODINGVIBES_CLOUD_API_KEY;
    if(!base)throw Object.assign(new Error('Build Vibe Cloud hosting is not configured.'),{code:'HOSTING_NOT_AVAILABLE',status:503});
    const data=await jsonFetch(base+'/deployments/'+encodeURIComponent(String(deploymentId)),{token});return{status:data.status||data.state||'unknown',deploymentId:data.id||deploymentId,url:data.url||null,providerProject:data.projectId||data.project||null};
  }
 },
 manual:{id:'manual',label:'Download ZIP / Other Hosting',type:'export',auth:'none',supports:{static:true,server:true},description:'Export a validated portable project ZIP for any compatible host.',
  async deploy({artifact}){const out=path.resolve(process.env.CODINGVIBES_EXPORT_ROOT||path.join(process.cwd(),'data','exports'),safeName(artifact.projectMetadata.name)+'-'+Date.now()+'.zip');const workspace=await createOptimizedExportWorkspace(artifact);try{return{status:'ready',deploymentId:out,url:null,file:zipDirectory(workspace.root,out),optimization:workspace.report}}finally{workspace.cleanup()}},
  status:async({deploymentId})=>({status:'ready',file:deploymentId})
 }
};
export function getProvider(id){return PROVIDERS[String(id||'').toLowerCase()]||null}
export function listProviders(){return Object.values(PROVIDERS).map(p=>({id:p.id,label:p.label,type:p.type,auth:p.auth,supports:p.supports,description:p.description}))}
