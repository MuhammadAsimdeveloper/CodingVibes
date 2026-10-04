import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {Store} from '../src/db/store.js';
import {canRole,defaultDesignSystem,normalizeDesignSystem,reflectBuild,domainVerificationInstructions,researchWeb} from '../src/platform/feature-suite.js';

test('workspace collaboration persists roles and grants shared project read access',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cv-suite-workspace-'));const store=new Store(path.join(dir,'db.sqlite'));
 const owner=store.createUser('owner@example.com','hash'),member=store.createUser('member@example.com','hash');
 const project=store.createProject(owner.id,{name:'Shared'});
 const ws=store.getWorkspace(project.workspace_id,owner.id);
 store.upsertWorkspaceMember(ws.id,member.id,'editor');
 assert.equal(store.getProject(project.id,member.id).id,project.id);
 assert.equal(store.getWorkspace(ws.id,member.id).role,'editor');
 assert.equal(store.listProjects(member.id).some(x=>x.id===project.id),true);
 assert.equal(canRole('editor','viewer'),true);
 assert.equal(canRole('viewer','editor'),false);
 store.close();fs.rmSync(dir,{recursive:true,force:true});
});

test('workspace invites are email-bound and approvals are reviewer/admin controlled',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cv-suite-invite-'));const store=new Store(path.join(dir,'db.sqlite'));
 const owner=store.createUser('owner@example.com','hash'),reviewer=store.createUser('reviewer@example.com','hash'),other=store.createUser('other@example.com','hash');
 const ws=store.createWorkspace(owner.id,'Team');
 const project=store.createProject(owner.id,{name:'App'});
 store.upsertWorkspaceMember(ws.id,reviewer.id,'reviewer');
 const crypto=(await import('node:crypto')); const token=crypto.randomBytes(20).toString('hex');
 const expires=new Date(Date.now()+3600000).toISOString();
 const invite=store.createWorkspaceInvite(ws.id,reviewer.email,'reviewer',owner.id,crypto.createHash('sha256').update(token).digest('hex'),expires);
 assert.equal(store.listWorkspaceInvites(ws.id,owner.id).length,1);
 assert.throws(()=>store.acceptWorkspaceInvite(crypto.createHash('sha256').update(token).digest('hex'),other.id),/invite_email_mismatch/);
 const accepted=store.acceptWorkspaceInvite(crypto.createHash('sha256').update(token).digest('hex'),reviewer.id);
 assert.equal(accepted.id,ws.id);
 const approval=store.createWorkspaceApproval(ws.id,project.id,{requestedBy:reviewer.id,kind:'publish'});
 assert.equal(store.decideWorkspaceApproval(approval.id,reviewer.id,'approved').status,'approved');
 store.close();fs.rmSync(dir,{recursive:true,force:true});
});

test('design mode normalizes tokens and forces reduced-motion safety',()=>{
 const design=normalizeDesignSystem({colors:{primary:'#123456'},radius:{md:99},motion:{durationMs:9999}});
 assert.equal(design.colors.primary,'#123456');
 assert.equal(design.radius.md,99);
 assert.equal(design.motion.durationMs,1200);
 assert.equal(design.motion.reducedMotion,true);
 assert.equal(defaultDesignSystem('futuristic').effects.threeD,false);
 assert.equal(defaultDesignSystem('immersive 3d').effects.threeD,true);
});

test('content revisions, cloud service state and domains are project-scoped',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cv-suite-content-'));const store=new Store(path.join(dir,'db.sqlite'));
 const user=store.createUser('content@example.com','hash');const project=store.createProject(user.id,{name:'Content'});
 const revision=store.createContentRevision(project.id,user.id,{kit:'business',pages:[{id:'home',title:'Home'}]},'draft');
 assert.equal(revision.version,1);
 assert.equal(store.publishContentRevision(revision.id,user.id).status,'published');
 const cloud=store.upsertCloudService(project.id,user.id,'database',{provider:'build-vibe-local',status:'ready'});
 assert.equal(cloud.type,'database');assert.equal(cloud.status,'ready');
 const domain=store.upsertDomain(project.id,user.id,'example.com','vercel');
 assert.equal(domain.domain,'example.com');assert.equal(domain.status,'pending');
 assert.equal(domainVerificationInstructions('example.com','vercel').provider,'vercel');
 store.close();fs.rmSync(dir,{recursive:true,force:true});
});

test('reflection produces actionable self-test state',()=>{
 const clean=reflectBuild({spec:{},verification:{passed:true},review:{passed:true},inspect:{status:{stdout:''}}});
 assert.equal(clean.status,'ready');assert.equal(clean.score,100);
 const blocked=reflectBuild({spec:null,verification:{passed:false},review:{passed:false},inspect:{status:{stdout:' M file'}}});
 assert.equal(blocked.status,'blocked');assert.ok(blocked.recommendations.length>=2);
});

test('research adapter fails closed when live research is not configured',async()=>{
 const out=await researchWeb('market research',{apiUrl:'',apiKey:''});
 assert.equal(out.configured,false);assert.deepEqual(out.results,[]);
});

test('platform feature suite artifacts are present',()=>{
 assert.ok(fs.existsSync('src/platform/feature-suite.js'));
 assert.ok(fs.existsSync('src/verification/discoverability.js'));
 const server=fs.readFileSync('src/server.js','utf8');
 for(const route of ['/api/workspaces','/api/projects/','/api/cloud/catalog','/api/projects/']) assert.ok(server.includes(route));
 assert.match(server,/discoverability/);
});
