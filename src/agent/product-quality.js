import fs from 'node:fs';
import path from 'node:path';

function walk(root,out=[]){
  if(!fs.existsSync(root)||out.length>500)return out;
  for(const e of fs.readdirSync(root,{withFileTypes:true})){
    if(['.git','node_modules','.codingvibes'].includes(e.name))continue;
    const p=path.join(root,e.name);
    if(e.isDirectory())walk(p,out);else if(/\.(html|css|js|jsx|ts|tsx|json|md|svg)$/i.test(e.name))out.push(p);
  }
  return out;
}
function textOf(files){let s='';for(const f of files){try{s+=fs.readFileSync(f,'utf8')+'\n'}catch{}}return s.slice(0,900000);}
function hasAny(s,arr){return arr.some(x=>s.toLowerCase().includes(x.toLowerCase()));}

export function auditProductExperience(workspace,spec={}){
  const files=walk(path.resolve(workspace));
  const names=files.map(x=>path.relative(workspace,x).replaceAll(path.sep,'/').toLowerCase());
  const source=textOf(files);
  const checks=[
    ['core entrypoint',names.some(x=>x==='public/index.html'||x==='index.html')],
    ['responsive layout',/(@media|viewport|responsive|clamp\()/i.test(source)],
    ['accessible focus',/focus-visible|aria-|role=/i.test(source)],
    ['reduced motion',/prefers-reduced-motion|reducedMotion/i.test(source)],
    ['metadata',/<meta[^>]+(description|og:|twitter:)/i.test(source)||/metadata|seo/i.test(source)],
    ['semantic navigation',/<nav\b|aria-label=.*nav/i.test(source)],
    ['interaction states',/hover|:active|pressed|loading|error/i.test(source)],
    ['launch surfaces',hasAny(source,['contact','privacy','terms','sitemap','robots'])],
    ['local assets/runtime',!/(https?:\/\/[^"'\s]+|skypack|unpkg|jsdelivr|cdn\.)/i.test(source)||hasAny(source,['fallback','local asset'])],
  ];
  const passed=checks.filter(x=>x[1]).length;
  const score=Math.round((passed/checks.length)*100);
  const missing=checks.filter(x=>!x[1]).map(x=>x[0]);
  const warnings=[];
  if(spec?.experience?.type==='interactive-3d-experience'&&!hasAny(source,['webgl','three','canvas']))warnings.push('3D contract requested but no 3D runtime evidence found.');
  if(spec?.behavior?.payments&&!hasAny(source,['checkout','payment']))warnings.push('Payment behavior requested but checkout/payment surface was not detected.');
  if(spec?.behavior?.authentication&&!hasAny(source,['login','sign in','auth']))warnings.push('Authentication requested but sign-in surface was not detected.');
  return {score,passed,total:checks.length,checks:checks.map(([name,ok])=>({name,passed:ok})),missing,warnings,portable:true,providerIndependent:true};
}
