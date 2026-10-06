import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {BUILD_VIBE_VERSION} from '../src/version.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const fail=[];
const read=(rel)=>fs.readFileSync(path.join(root,rel),'utf8');
const pkg=JSON.parse(read('package.json'));

if(pkg.name!=='build-vibe')fail.push('package_name_mismatch');
if(pkg.version!==BUILD_VIBE_VERSION)fail.push(`package_version_mismatch:${pkg.version}`);
if(!/^\d+\.\d+\.\d+$/.test(BUILD_VIBE_VERSION))fail.push('invalid_semver');

for(const rel of ['README.md','docs/FINAL_RELEASE.md']){
  const text=read(rel);
  if(!text.includes(`Build Vibe ${BUILD_VIBE_VERSION}`) && !text.includes(`Current release: ${BUILD_VIBE_VERSION}`)){
    fail.push(`release_missing:${rel}`);
  }
}
const server=read('src/server.js');
if(!server.includes("from './version.js'"))fail.push('server_version_import_missing');
if(fs.existsSync(path.join(root,'package-lock.json'))){
  const lock=JSON.parse(read('package-lock.json'));
  if(lock.name!=='build-vibe')fail.push('lockfile_name_mismatch');
  if(lock.version!==BUILD_VIBE_VERSION)fail.push(`lockfile_version_mismatch:${lock.version}`);
}
if(fail.length){
  console.error('Build Vibe release check: FAIL');
  for(const item of fail)console.error('- '+item);
  process.exit(2);
}
console.log(JSON.stringify({ok:true,name:pkg.name,version:BUILD_VIBE_VERSION,packageLockPresent:fs.existsSync(path.join(root,'package-lock.json'))},null,2));
console.log('Build Vibe release check: PASS');
