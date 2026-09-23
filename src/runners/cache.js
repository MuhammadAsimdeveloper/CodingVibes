import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const LOCKFILES=['package-lock.json','npm-shrinkwrap.json','pnpm-lock.yaml','yarn.lock','pubspec.lock','gradle.lockfile','gradle/libs.versions.toml','Cargo.lock','Package.resolved'];
const TOOLCHAIN_FILES=['package.json','pubspec.yaml','settings.gradle','settings.gradle.kts','build.gradle','build.gradle.kts','src-tauri/Cargo.toml','Package.swift'];

function digest(parts){const h=crypto.createHash('sha256');for(const part of parts)h.update(String(part)).update('\0');return h.digest('hex');}
function readIf(root,rel){const file=path.join(root,rel);try{return fs.readFileSync(file);}catch{return null;}}

export function dependencyCacheKey(workspace,{targetId,runnerImage='unknown',toolchainVersion='unknown'}={}){
  const parts=[targetId,runnerImage,toolchainVersion];
  for(const rel of LOCKFILES){const data=readIf(workspace,rel);if(data)parts.push(rel,digest([data.toString('base64')]));}
  for(const rel of TOOLCHAIN_FILES){const data=readIf(workspace,rel);if(data)parts.push(rel,digest([data.toString('base64')]));}
  return digest(parts);
}

export function cacheVolumeName({targetId,key}={}){
  const safe=String(key||'').replace(/[^a-f0-9]/gi,'').slice(0,24)||'nocache';
  return `codingvibes-cache-${String(targetId||'target').replace(/[^a-z0-9-]/gi,'-').slice(0,30)}-${safe}`;
}

export function dependencyCachePolicy(targetId){
  const base={enabled:process.env.CODINGVIBES_ENABLE_DEP_CACHE==='true',mode:'named-volume',shared:false,sourceMounts:false};
  if(targetId==='mobile-flutter')return {...base,paths:['/tmp/pub-cache']};
  if(['android-kotlin','android-twa','multiplatform-kmp'].includes(targetId))return {...base,paths:['/tmp/gradle']};
  if(targetId==='desktop-tauri')return {...base,paths:['/tmp/cargo','/tmp/rustup']};
  if(targetId==='mobile-expo')return {...base,paths:['/tmp/npm-cache']};
  return base;
}
