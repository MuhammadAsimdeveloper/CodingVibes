import fs from 'node:fs';
import path from 'node:path';

const NODE_BUILTINS=new Set(['node:fs','node:path','node:http','node:crypto','node:child_process','node:url','node:util','node:sqlite','fs','path','http','crypto','util']);
function readJson(root,file){try{return JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));}catch{return null;}}
export function inspectDependencies(workspace,target){
  const deps=[];
  const pkg=readJson(workspace,'package.json');
  if(pkg){for(const [name,version] of Object.entries({...pkg.dependencies,...pkg.devDependencies,...pkg.optionalDependencies}))if(!NODE_BUILTINS.has(name))deps.push({manager:'npm',name,version:String(version),source:'package.json'});}
  const pub=path.join(workspace,'pubspec.yaml');if(fs.existsSync(pub)){const text=fs.readFileSync(pub,'utf8');for(const m of text.matchAll(/^\s{2}([a-zA-Z0-9_]+):\s*(.*)$/gm)){const name=m[1];if(!['sdk'].includes(name))deps.push({manager:'pub',name,version:m[2].trim(),source:'pubspec.yaml'});}}
  const gradleFiles=['build.gradle.kts','app/build.gradle.kts','shared/build.gradle.kts'];for(const rel of gradleFiles){const file=path.join(workspace,rel);if(!fs.existsSync(file))continue;const text=fs.readFileSync(file,'utf8');for(const m of text.matchAll(/implementation\(["']([^"']+)["']\)/g))deps.push({manager:'gradle',name:m[1],version:'declared',source:rel});}
  const cargo=path.join(workspace,'src-tauri/Cargo.toml');if(fs.existsSync(cargo)){const text=fs.readFileSync(cargo,'utf8');const inDeps=text.split('\n').slice(Math.max(0,text.indexOf('[dependencies]')));for(const line of inDeps){const m=line.match(/^([A-Za-z0-9_-]+)\s*=\s*(.+)$/);if(m&&m[1]!=='dependencies')deps.push({manager:'cargo',name:m[1],version:m[2].trim(),source:'src-tauri/Cargo.toml'});}}
  const unique=[];const seen=new Set();for(const dep of deps){const key=`${dep.manager}:${dep.name}`;if(seen.has(key))continue;seen.add(key);unique.push(dep);}
  return {target:target.id,dependencies:unique,requiresNetwork:unique.length>0,approvalRequired:unique.length>0,installPolicy:'explicit-user-approval-before-network-install'};
}
