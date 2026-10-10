#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { auditGeneratedSite } from '../src/verification/generated-site-quality.js';

function walk(root, output=[]) {
  if (!fs.existsSync(root)) return output;
  for (const entry of fs.readdirSync(root,{withFileTypes:true})) {
    if (['.git','node_modules','.codingvibes','.build-vibe'].includes(entry.name)) continue;
    const full=path.join(root,entry.name);
    if (entry.isDirectory()) walk(full,output);
    else if (entry.isFile()) {
      const relative=path.relative(process.cwd(),full).replaceAll(path.sep,'/');
      if (/\.(html?|css|js|json|webmanifest|txt|xml|svg|png|jpe?g|webp|avif)$/i.test(entry.name)) {
        if (/\.(png|jpe?g|webp|avif)$/i.test(entry.name)) {
          output.push([relative,{sizeBytes:fs.statSync(full).size,contentType:contentType(entry.name),name:entry.name}]);
        } else output.push([relative,fs.readFileSync(full,'utf8')]);
      }
    }
  }
  return output;
}
function contentType(name) {
  const ext=path.extname(name).toLowerCase();
  return ({'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.avif':'image/avif'})[ext]||'application/octet-stream';
}
function main() {
  const root=path.resolve(process.argv[2]||process.cwd());
  const configPath=process.argv[3]?path.resolve(process.argv[3]):path.join(root,'.build-vibe-quality.json');
  const config=fs.existsSync(configPath)?JSON.parse(fs.readFileSync(configPath,'utf8')):{};
  const files=Object.fromEntries(walk(root).map(([name,value])=>[path.relative(root,path.resolve(name)).replaceAll(path.sep,'/'),value]));
  const report=auditGeneratedSite({files,baseUrl:config.baseUrl||process.env.SITE_URL||'',config});
  process.stdout.write(JSON.stringify(report,null,2)+'\n');
  const criticalBlockers=report.requirements.filter(item=>item.severity==='critical'&&!['PASS','NOT_APPLICABLE'].includes(item.status));
  if(criticalBlockers.length) process.exitCode=2;
}
if (import.meta.url===pathToFileURL(process.argv[1]||'').href) main();
