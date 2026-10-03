import fs from 'node:fs';
import path from 'node:path';

export const DEFAULT_VISUAL_THRESHOLD=Number(process.env.CODINGVIBES_VISUAL_THRESHOLD||0.015);
export const DEFAULT_PIXEL_THRESHOLD=Number(process.env.CODINGVIBES_PIXEL_THRESHOLD||18);

function routeKey(route){return encodeURIComponent(String(route).replace(/^\/+/,'')||'home').replace(/%/g,'_').slice(0,180)}
async function pngApi(){try{return await import('pngjs')}catch{return null}}

export async function comparePng(currentPath,baselinePath,diffPath,{visualThreshold=DEFAULT_VISUAL_THRESHOLD,pixelThreshold=DEFAULT_PIXEL_THRESHOLD}={}){
  const png=await pngApi();
  if(!png)return{available:false,passed:true,skipped:'pngjs unavailable'};
  if(!fs.existsSync(currentPath)||!fs.existsSync(baselinePath))return{available:true,passed:true,skipped:'baseline_missing'};
  const {PNG}=png;let current,baseline;
  try{current=PNG.sync.read(fs.readFileSync(currentPath));baseline=PNG.sync.read(fs.readFileSync(baselinePath));}
  catch(e){return{available:true,passed:false,error:'png_decode_failed:'+e.message}};
  if(current.width!==baseline.width||current.height!==baseline.height){
    return{available:true,passed:false,reason:'dimensions_changed',current:{width:current.width,height:current.height},baseline:{width:baseline.width,height:baseline.height},changedRatio:1};
  }
  const diff=new PNG({width:current.width,height:current.height});let changed=0,maxDelta=0;
  for(let i=0;i<current.data.length;i+=4){
    const delta=Math.max(
      Math.abs(current.data[i]-baseline.data[i]),
      Math.abs(current.data[i+1]-baseline.data[i+1]),
      Math.abs(current.data[i+2]-baseline.data[i+2]),
      Math.abs(current.data[i+3]-baseline.data[i+3])
    );
    if(delta>maxDelta)maxDelta=delta;
    if(delta>pixelThreshold){changed++;diff.data[i]=255;diff.data[i+1]=40;diff.data[i+2]=70;diff.data[i+3]=180;}
    else{diff.data[i]=0;diff.data[i+1]=0;diff.data[i+2]=0;diff.data[i+3]=0;}
  }
  const pixels=current.width*current.height,changedRatio=pixels?changed/pixels:1;
  fs.mkdirSync(path.dirname(diffPath),{recursive:true});fs.writeFileSync(diffPath,PNG.sync.write(diff));
  return{available:true,passed:changedRatio<=visualThreshold,width:current.width,height:current.height,changedPixels:changed,totalPixels:pixels,changedRatio,maxDelta,threshold:visualThreshold,pixelThreshold,diffPath};
}
export function baselinePath(root,route){return path.join(root,routeKey(route)+'.png')}
export function visualArtifactName(route,suffix='current'){return routeKey(route)+'.'+suffix+'.png'}
