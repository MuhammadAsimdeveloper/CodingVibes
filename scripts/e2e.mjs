import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {Store} from '../src/db/store.js';
import {ModelRouter} from '../src/ai/router.js';
import {ensureProjectRepository} from '../src/projects-workspace.js';
import {executeBuild} from '../src/agent/orchestrator.js';
import {cleanupWorkspace} from '../src/git/workspace.js';

const root=fs.mkdtempSync(path.join(os.tmpdir(),'codingvibes-e2e-'));
const prev={};for(const k of ['DATABASE_PATH','CODINGVIBES_PROJECT_ROOT','CODINGVIBES_WORK_ROOT','CODINGVIBES_RUNTIME','CODINGVIBES_ENABLE_BROWSER'])prev[k]=process.env[k];
Object.assign(process.env,{DATABASE_PATH:path.join(root,'db','test.db'),CODINGVIBES_PROJECT_ROOT:path.join(root,'projects'),CODINGVIBES_WORK_ROOT:path.join(root,'worktrees'),CODINGVIBES_RUNTIME:'local',CODINGVIBES_ENABLE_BROWSER:'false'});
const store=new Store(process.env.DATABASE_PATH);
let workspaceRoot,workspace;
try{
 const user=store.createUser('e2e@example.com','hash');const p=store.createProject(user.id,{name:'E2E'});const repo=await ensureProjectRepository(p);store.updateProjectRepo(p.id,repo);workspaceRoot=repo;const session=store.createSession(user.id,p.id,'Build');
 const result=await executeBuild({request:'Build an appointment dashboard with login, calendar and admin page',userId:user.id,sessionId:session.id,project:store.getProject(p.id,user.id),store,router:new ModelRouter({...process.env,CODINGVIBES_API_KEY:''})});
 workspace=result.workspace;assert.equal(result.verification.passed,true);assert.match(result.branch,/^cv\//);assert.ok(result.evidence.some(e=>e.type==='verification'));assert.ok(fs.existsSync(path.join(result.workspace,'codingvibes.app.json')));
 console.log(JSON.stringify({ok:true,status:result.verification.passed?'verified':'failed',branch:result.branch,pages:result.spec.pages.length,apis:result.spec.apis.length,evidence:result.evidence.length},null,2));
}finally{if(workspace&&workspaceRoot)await cleanupWorkspace(workspaceRoot,workspace);store.close();for(const [k,v] of Object.entries(prev))v===undefined?delete process.env[k]:process.env[k]=v;}
