import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {Store} from '../src/db/store.js';
import {ModelRouter} from '../src/ai/router.js';
import {ensureProjectRepository} from '../src/projects-workspace.js';
import {executeBuild} from '../src/agent/orchestrator.js';
import {cleanupWorkspace} from '../src/git/workspace.js';

const root=fs.mkdtempSync(path.join(os.tmpdir(),'codingvibes-e2e-'));
const prev={};for(const k of ['DATABASE_PATH','CODINGVIBES_PROJECT_ROOT','CODINGVIBES_WORK_ROOT','CODINGVIBES_RUNTIME','CODINGVIBES_ENABLE_BROWSER'])prev[k]=process.env[k];
Object.assign(process.env,{DATABASE_PATH:path.join(root,'db','test.db'),CODINGVIBES_PROJECT_ROOT:path.join(root,'projects'),CODINGVIBES_WORK_ROOT:path.join(root,'worktrees'),CODINGVIBES_RUNTIME:'local',CODINGVIBES_ENABLE_BROWSER:process.env.CODINGVIBES_E2E_BROWSER==='true'?'true':'false'});
const store=new Store(process.env.DATABASE_PATH);
const workspaces=[];
try{
 const user=store.createUser('e2e@example.com','hash');
 const router=new ModelRouter({...process.env,CODINGVIBES_API_KEY:''});
 const p=store.createProject(user.id,{name:'E2E Appointment Dashboard'});const repo=await ensureProjectRepository(p);store.updateProjectRepo(p.id,repo);const session=store.createSession(user.id,p.id,'Build');
 const result=await executeBuild({request:'Build an appointment dashboard with login, calendar and admin page',userId:user.id,sessionId:session.id,project:store.getProject(p.id,user.id),store,router});
 workspaces.push({root:repo,workspace:result.workspace});assert.equal(result.verification.passed,true,'dashboard verification='+JSON.stringify(result.verification));assert.match(result.branch,/^cv\//);assert.ok(result.evidence.some(e=>e.type==='verification'));assert.ok(fs.existsSync(path.join(result.workspace,'codingvibes.app.json')));
 const p3d=store.createProject(user.id,{name:'E2E 3D Product Showroom'});const repo3d=await ensureProjectRepository(p3d);store.updateProjectRepo(p3d.id,repo3d);const session3d=store.createSession(user.id,p3d.id,'Build 3D');
 const result3d=await executeBuild({request:'Build an immersive 3D product showroom with uploaded GLB models, accessible camera controls, image texture application and a video walkthrough',userId:user.id,sessionId:session3d.id,project:store.getProject(p3d.id,user.id),store,router});
 workspaces.push({root:repo3d,workspace:result3d.workspace});assert.equal(result3d.verification.passed,true,'3D showroom verification='+JSON.stringify(result3d.verification));assert.equal(result3d.spec.experience?.threeD,true,'3D request must produce a 3D experience contract');
 const html=fs.readFileSync(path.join(result3d.workspace,'public','index.html'),'utf8');const runtime=fs.readFileSync(path.join(result3d.workspace,'public','experience.js'),'utf8');
 assert.match(html,/id="experience3d"/);assert.match(html,/id="applyExperienceTexture"/);assert.match(html,/id="tourRecord"/);assert.match(html,/id="videoInput"/);
 const runtimePath=path.join(root,'3d-experience-check.mjs');fs.writeFileSync(runtimePath,runtime,'utf8');const checked=spawnSync(process.execPath,['--check',runtimePath],{encoding:'utf8'});assert.equal(checked.status,0,checked.stderr||checked.stdout);
 console.log(JSON.stringify({ok:true,status:'verified',projects:[{kind:'appointment-dashboard',branch:result.branch,pages:result.spec.pages.length,apis:result.spec.apis.length,evidence:result.evidence.length},{kind:'3d-product-showroom',branch:result3d.branch,pages:result3d.spec.pages.length,apis:result3d.spec.apis.length,evidence:result3d.evidence.length,textureUpload:true,videoWalkthrough:true,runtimeSyntax:'pass'}]},null,2));
}finally{for(const item of workspaces)await cleanupWorkspace(item.root,item.workspace);store.close();for(const [k,v] of Object.entries(prev))v===undefined?delete process.env[k]:process.env[k]=v;}
