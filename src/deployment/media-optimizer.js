import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const RASTER_EXTENSIONS=new Set(['.png','.jpg','.jpeg','.webp','.avif']);
const MAX_INPUT_BYTES=100*1024*1024;
const MAX_INPUT_PIXELS=50_000_000;

async function loadSharp(){
  try{const mod=await import('sharp');return mod.default||mod;}catch{return null;}
}
async function loadPng(){
  try{const mod=await import('pngjs');return mod.PNG||mod.default?.PNG||null;}catch{return null;}
}
function safeRelativePath(value){
  const file=String(value||'').replace(/\\\\/g,'/');
  if(!file||file.startsWith('/')||file.split('/').some(part=>!part||part==='.'||part==='..'))throw new Error('invalid_export_asset_path');
  return file;
}
function resizeRgba(source,sourceWidth,sourceHeight,width,height){
  const output=Buffer.alloc(width*height*4);
  for(let y=0;y<height;y++){
    const sy=Math.max(0,Math.min(sourceHeight-1,(y+0.5)*sourceHeight/height-0.5));
    const y0=Math.floor(sy),y1=Math.min(sourceHeight-1,y0+1),fy=sy-y0;
    for(let x=0;x<width;x++){
      const sx=Math.max(0,Math.min(sourceWidth-1,(x+0.5)*sourceWidth/width-0.5));
      const x0=Math.floor(sx),x1=Math.min(sourceWidth-1,x0+1),fx=sx-x0;
      const a=(y0*sourceWidth+x0)*4,b=(y0*sourceWidth+x1)*4,c=(y1*sourceWidth+x0)*4,d=(y1*sourceWidth+x1)*4,o=(y*width+x)*4;
      for(let channel=0;channel<4;channel++){
        const top=source[a+channel]*(1-fx)+source[b+channel]*fx;
        const bottom=source[c+channel]*(1-fx)+source[d+channel]*fx;
        output[o+channel]=Math.round(top*(1-fy)+bottom*fy);
      }
    }
  }
  return output;
}
function targetDimensions(width,height,maxDimension){
  const scale=Math.min(1,maxDimension/width,maxDimension/height);
  return {width:Math.max(1,Math.round(width*scale)),height:Math.max(1,Math.round(height*scale))};
}
async function optimizeOne(filePath,extension,source,{sharp,PNG,maxDimension,minSavingsRatio}){
  if(source.length>MAX_INPUT_BYTES)return {status:'skipped',reason:'input_too_large',originalBytes:source.length};
  if(!sharp&&!(extension==='.png'&&PNG))return {status:'skipped',reason:'encoder_unavailable',originalBytes:source.length};
  try{
    let width,height,format,output;
    if(sharp){
      const image=sharp(source,{limitInputPixels:MAX_INPUT_PIXELS,animated:false});
      const metadata=await image.metadata();
      width=Number(metadata.width);height=Number(metadata.height);format=metadata.format;
      const expectedFormat={'.png':'png','.jpg':'jpeg','.jpeg':'jpeg','.webp':'webp','.avif':'avif'}[extension];
      if(format!==expectedFormat)return {status:'skipped',reason:'extension_format_mismatch',originalBytes:source.length};
      if(!width||!height||width*height>MAX_INPUT_PIXELS)return {status:'skipped',reason:'invalid_or_oversized_dimensions',originalBytes:source.length};
      const dimensions=targetDimensions(width,height,maxDimension);
      if(dimensions.width===width&&dimensions.height===height)return {status:'unchanged',reason:'within_dimension_budget',width,height,originalBytes:source.length,optimizedBytes:source.length};
      const encoder={jpeg:{quality:88,mozjpeg:true},jpg:{quality:88,mozjpeg:true},webp:{quality:88},avif:{quality:65},png:{compressionLevel:9,adaptiveFiltering:true}}[format];
      if(!encoder||!RASTER_EXTENSIONS.has(extension))return {status:'skipped',reason:'unsupported_encoding',width,height,originalBytes:source.length};
      output=await image.resize({width:dimensions.width,height:dimensions.height,fit:'inside',withoutEnlargement:true}).toFormat(format,encoder).toBuffer();
      width=dimensions.width;height=dimensions.height;
    }else{
      const decoded=PNG.sync.read(source);
      width=Number(decoded.width);height=Number(decoded.height);
      if(!width||!height||width*height>MAX_INPUT_PIXELS)return {status:'skipped',reason:'invalid_or_oversized_dimensions',originalBytes:source.length};
      const dimensions=targetDimensions(width,height,maxDimension);
      if(dimensions.width===width&&dimensions.height===height)return {status:'unchanged',reason:'within_dimension_budget',width,height,originalBytes:source.length,optimizedBytes:source.length};
      const pixels=resizeRgba(decoded.data,width,height,dimensions.width,dimensions.height);
      const encoded=new PNG({width:dimensions.width,height:dimensions.height});
      pixels.copy(encoded.data);
      output=PNG.sync.write(encoded,{compressionLevel:9,filterType:4});
      width=dimensions.width;height=dimensions.height;
    }
    if(output.length>=source.length*(1-minSavingsRatio))return {status:'unchanged',reason:'insufficient_size_saving',width,height,originalBytes:source.length,optimizedBytes:source.length};
    fs.writeFileSync(filePath,output);
    return {status:'optimized',reason:'resized_and_reencoded',width,height,originalBytes:source.length,optimizedBytes:output.length,savedBytes:source.length-output.length};
  }catch{
    return {status:'skipped',reason:'decode_or_encode_failed',originalBytes:source.length};
  }
}

/**
 * Build an isolated export copy and optimize only oversized raster images there.
 * The source project is never mutated and every asset keeps its original path.
 */
export async function createOptimizedExportWorkspace(artifact,{maxDimension=1920,minSavingsRatio=0.02}={}){
  if(!artifact||typeof artifact.root!=='string'||!Array.isArray(artifact.files))throw new TypeError('invalid_export_artifact');
  if(!Number.isInteger(maxDimension)||maxDimension<256||maxDimension>8192)throw new RangeError('maxDimension_must_be_256_to_8192');
  if(!Number.isFinite(minSavingsRatio)||minSavingsRatio<0||minSavingsRatio>0.5)throw new RangeError('minSavingsRatio_must_be_0_to_0.5');
  const temporaryDirectory=fs.mkdtempSync(path.join(os.tmpdir(),'build-vibe-export-'));
  const root=path.join(temporaryDirectory,'project');
  const report={schema:'build-vibe.raster-optimization.v1',maxDimension,examined:0,optimized:0,unchanged:0,skipped:0,originalBytes:0,optimizedBytes:0,savedBytes:0,assets:[],assetDetailsOmitted:0};
  try{
    fs.mkdirSync(root,{recursive:true});
    const copiedFiles=[];
    for(const item of artifact.files){
      const relative=safeRelativePath(item.path),source=path.resolve(artifact.root,relative),target=path.resolve(root,relative);
      if(!source.startsWith(path.resolve(artifact.root)+path.sep)||!target.startsWith(root+path.sep))throw new Error('invalid_export_asset_path');
      const stat=fs.statSync(source);
      if(!stat.isFile())continue;
      fs.mkdirSync(path.dirname(target),{recursive:true});
      fs.copyFileSync(source,target);
      copiedFiles.push({...item,path:relative,size:stat.size});
    }
    const sharp=await loadSharp(),PNG=sharp?null:await loadPng();
    for(const item of copiedFiles){
      const extension=path.extname(item.path).toLowerCase();
      if(!RASTER_EXTENSIONS.has(extension))continue;
      const full=path.join(root,item.path),source=fs.readFileSync(full);
      report.examined++;report.originalBytes+=source.length;
      const result=await optimizeOne(full,extension,source,{sharp,PNG,maxDimension,minSavingsRatio});
      if(report.assets.length<100)report.assets.push({path:item.path,...result});else report.assetDetailsOmitted++;
      if(result.status==='optimized'){report.optimized++;report.savedBytes+=result.savedBytes;report.optimizedBytes+=result.optimizedBytes;item.size=result.optimizedBytes;}
      else if(result.status==='unchanged'){report.unchanged++;report.optimizedBytes+=source.length;}
      else{report.skipped++;report.optimizedBytes+=source.length;}
    }
    for(const item of copiedFiles){
      const target=path.join(root,item.path);
      item.size=fs.statSync(target).size;
    }
    let cleaned=false;
    return {root,files:copiedFiles,report,cleanup(){if(cleaned)return;cleaned=true;fs.rmSync(temporaryDirectory,{recursive:true,force:true});}};
  }catch(error){
    fs.rmSync(temporaryDirectory,{recursive:true,force:true});
    throw error;
  }
}
