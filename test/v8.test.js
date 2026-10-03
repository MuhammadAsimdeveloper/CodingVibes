import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {analyzeRequirements} from '../src/agent/requirements.js';
import {generateProject,materializeProject} from '../src/agent/project-generator.js';
import {inspectProjectArtifact} from '../src/deployment/artifact.js';
import {zipDirectory} from '../src/deployment/zip.js';
import {encryptSecret,decryptSecret} from '../src/security/vault.js';
import {Store} from '../src/db/store.js';
import {deploymentCatalog,validateProvider} from '../src/deployment/index.js';

test('every generated website has owner admin; login is opt-in and Google-backed',()=>{
  const noLogin=analyzeRequirements('Build a luxury portfolio website with projects and contact form.');
  assert.equal(noLogin.behavior.adminPortal,true);
  assert.equal(noLogin.behavior.ownerOnlyAdmin,true);
  assert.equal(noLogin.pages.includes('/admin'),true);
  assert.equal(noLogin.pages.includes('/login'),false);
  const login=analyzeRequirements('Build a business website with a login section and Google login.');
  assert.equal(login.behavior.publicLogin,true);
  assert.equal(login.behavior.googleLogin,true);
  assert.equal(login.pages.includes('/admin'),true);
  assert.equal(login.pages.includes('/login'),true);
  assert.ok(login.apis.some(x=>x.path==='/api/auth/session'));
});

test('generated project contains dedicated admin, optional login, env example and portable ignore rules',()=>{
  const spec=analyzeRequirements('Build an online store with owner admin portal.');
  const plan=generateProject(spec);const names=plan.files.map(x=>x.path);
  assert.ok(names.includes('public/admin.html'));
  assert.ok(names.includes('app/auth.js'));
  assert.ok(names.includes('.env.example'));
  assert.ok(names.includes('.gitignore'));
  assert.ok(!names.includes('public/login.html'));
  const loginSpec=analyzeRequirements('Build a store with login using Google.');
  const loginPlan=generateProject(loginSpec);assert.ok(loginPlan.files.some(x=>x.path==='public/login.html'));
});

test('generated project server and admin runtime pass node syntax checks',()=>{
  const spec=analyzeRequirements('Build an ecommerce storefront with login and Google authentication.');
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'cv-v8-generated-'));materializeProject(generateProject(spec),root);
  for(const f of ['app/server.js','app/auth.js','public/app.js','public/content-runtime.js','public/experience.js'])execFileSync(process.execPath,['--check',path.join(root,f)]);
});

test('portable artifact detects server runtime and environment variables without .env secrets',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'cv-v8-artifact-'));fs.mkdirSync(path.join(root,'app'));fs.mkdirSync(path.join(root,'public'));fs.writeFileSync(path.join(root,'package.json'),JSON.stringify({name:'demo',scripts:{start:'node app/server.js',build:'vite'},engines:{node:'22'}}));fs.writeFileSync(path.join(root,'app','server.js'),'export const ok=true;');fs.writeFileSync(path.join(root,'.env.example'),'DATABASE_URL=\\nGOOGLE_CLIENT_ID=\\n');fs.writeFileSync(path.join(root,'.env'),'PASSWORD=secret\\n');fs.writeFileSync(path.join(root,'public','index.html'),'<!doctype html><html><head></head><body></body></html>');
  const artifact=inspectProjectArtifact(root);assert.equal(artifact.framework,'unknown');assert.equal(artifact.packageManager,'npm');assert.equal(artifact.server,true);assert.equal(artifact.deploymentMetadata.serverRequired,true);assert.deepEqual(artifact.environmentVariables,['DATABASE_URL','GOOGLE_CLIENT_ID']);assert.ok(artifact.deploymentMetadata.secrets.includes('.env'));
});

test('ZIP export excludes git and node_modules and preserves env example without .env',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'cv-v8-zip-'));fs.mkdirSync(path.join(root,'node_modules'));fs.mkdirSync(path.join(root,'.git'));fs.writeFileSync(path.join(root,'index.html'),'hello');fs.writeFileSync(path.join(root,'.env.example'),'KEY=');fs.writeFileSync(path.join(root,'.env'),'KEY=SECRET');const zip=path.join(root,'site.zip');zipDirectory(root,zip);const bytes=fs.readFileSync(zip);const text=bytes.toString('binary');assert.ok(text.includes('index.html'));assert.ok(text.includes('.env.example'));assert.equal(text.includes('.env\\u0000'),false);assert.equal(text.includes('SECRET'),false);
});

test('vault encrypts provider credentials without storing plaintext',()=>{
  const value='super-secret-provider-token';const cipher=encryptSecret(value);assert.notEqual(cipher,value);assert.equal(decryptSecret(cipher),value);assert.notEqual(cipher.includes(value),true);
});

test('deployment connections and history are user-scoped and provider catalog is abstracted',()=>{
  const db=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'cv-v8-store-')),'db.sqlite');const store=new Store(db);const user=store.createUser('deploy@example.com','hash');const other=store.createUser('other@example.com','hash');
  store.upsertProviderConnection(user.id,'github',encryptSecret(JSON.stringify({accessToken:'secret'})),{login:'owner'});
  assert.equal(store.listProviderConnections(user.id).length,1);assert.equal(store.listProviderConnections(other.id).length,0);
  const project=store.createProject(user.id,{name:'Deploy'});const d=store.createDeployment(user.id,project.id,{provider:'manual',status:'ready',deploymentId:'zip-1',url:null,metadata:{artifactFingerprint:'abc'}});assert.equal(store.listDeployments(project.id,user.id)[0].id,d.id);store.close();
  const providers=deploymentCatalog().map(x=>x.id);for(const id of ['github','vercel','netlify','cloudflare','coding-vibes','manual'])assert.ok(providers.includes(id));
});

test('deployment compatibility is explicit for server-backed admin projects',()=>{
  const artifact={deploymentMetadata:{serverRequired:true,missingFiles:[]}};
  assert.equal(validateProvider('github',artifact).compatible,true);
  assert.equal(validateProvider('manual',artifact).compatible,true);
  assert.equal(validateProvider('vercel',artifact).compatible,false);
  assert.equal(validateProvider('netlify',artifact).compatible,false);
  assert.equal(validateProvider('cloudflare',artifact).compatible,false);
});
