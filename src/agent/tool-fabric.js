import fs from 'node:fs';
import path from 'node:path';
import {runTool} from '../tool-fabric/index.js';

const MAX_DISCOVERED_HTML = 2000;
const DEFAULT_MAX_PAGES = 40;
const DEFAULT_MAX_BYTES_PER_FILE = 1_000_000;
const SKIP_DIRS = new Set(['node_modules','.git','.codingvibes','.next','dist','build','coverage']);

function safeLimit(value, fallback, max) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(1, Math.min(max, Math.floor(number))) : fallback;
}

function collectHtmlFiles(publicDir) {
  const files = [];
  const stack = [{absolute:publicDir,relative:''}];
  let discoveryTruncated = false;
  while (stack.length) {
    const current = stack.pop();
    let entries;
    try { entries = fs.readdirSync(current.absolute,{withFileTypes:true}); }
    catch { continue; }
    entries.sort((a,b)=>a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) stack.push({
          absolute:path.join(current.absolute,entry.name),
          relative:current.relative ? current.relative+'/'+entry.name : entry.name
        });
      } else if (entry.isFile() && /\.html?$/i.test(entry.name)) {
        const relative=current.relative ? current.relative+'/'+entry.name : entry.name;
        const absolute=path.join(current.absolute,entry.name);
        let stat;
        try { stat=fs.statSync(absolute); } catch { continue; }
        files.push({path:relative,absolute,bytes:stat.size});
        if(files.length>=MAX_DISCOVERED_HTML) {
          discoveryTruncated=true;
          stack.length=0;
          break;
        }
      }
    }
    files.sort((a,b)=>a.path.localeCompare(b.path));
    if(discoveryTruncated) break;
  }
  return {files,discoveryTruncated};
}

/**
 * Run Build Vibe's existing local SEO and accessibility utilities against
 * generated public HTML. This is supporting evidence, not a release gate:
 * it does not fetch URLs or claim full browser/screen-reader validation.
 */
export async function auditGeneratedProject(workspace, options = {}) {
  const root=path.resolve(String(workspace || '.'));
  const publicDir=path.join(root,'public');
  if(!fs.existsSync(publicDir)) {
    return {version:1,status:'SKIPPED',reason:'public_directory_missing',networkUsed:false,pagesScanned:0,oversizedFiles:0,truncated:false,pages:[],summary:{seoFindings:0,accessibilityFindings:0,seoErrors:0,accessibilityErrors:0}};
  }
  let publicStat;
  try { publicStat=fs.lstatSync(publicDir); }
  catch {
    return {version:1,status:'SKIPPED',reason:'public_directory_missing',networkUsed:false,pagesScanned:0,oversizedFiles:0,truncated:false,pages:[],summary:{seoFindings:0,accessibilityFindings:0,seoErrors:0,accessibilityErrors:0}};
  }
  if(!publicStat.isDirectory() || publicStat.isSymbolicLink()) {
    return {version:1,status:'SKIPPED',reason:'public_directory_not_real_directory',networkUsed:false,pagesScanned:0,oversizedFiles:0,truncated:false,pages:[],summary:{seoFindings:0,accessibilityFindings:0,seoErrors:0,accessibilityErrors:0}};
  }

  const maxPages=safeLimit(options.maxPages,DEFAULT_MAX_PAGES,DEFAULT_MAX_PAGES);
  const maxBytesPerFile=safeLimit(options.maxBytesPerFile,DEFAULT_MAX_BYTES_PER_FILE,DEFAULT_MAX_BYTES_PER_FILE);
  const found=collectHtmlFiles(publicDir);
  const oversized=found.files.filter(file=>file.bytes>maxBytesPerFile);
  const eligible=found.files.filter(file=>file.bytes<=maxBytesPerFile);
  const selected=eligible.slice(0,maxPages);
  const pages=[];
  let seoFindings=0,accessibilityFindings=0,seoErrors=0,accessibilityErrors=0;

  for(const file of oversized) {
    pages.push({path:file.path,bytes:file.bytes,status:'INPUT_TOO_LARGE',seo:null,accessibility:null});
  }
  for(const file of selected) {
    let html;
    try { html=fs.readFileSync(file.absolute,'utf8'); }
    catch(error) {
      pages.push({path:file.path,bytes:file.bytes,status:'READ_FAILED',error:String(error.message||error).slice(0,160),seo:null,accessibility:null});
      continue;
    }
    const [seo,a11y]=await Promise.all([
      runTool('seo.audit',{html}),
      runTool('web.accessibility.audit',{html})
    ]);
    const seoOutput=seo.status==='COMPLETED'?seo.output:null;
    const a11yOutput=a11y.status==='COMPLETED'?a11y.output:null;
    const seoItems=seoOutput?.findings||[];
    const a11yItems=a11yOutput?.findings||[];
    seoFindings+=seoItems.length;
    accessibilityFindings+=a11yItems.length;
    seoErrors+=seoItems.filter(item=>item.severity==='error').length;
    accessibilityErrors+=a11yItems.filter(item=>item.severity==='error').length;
    pages.push({
      path:file.path,bytes:file.bytes,status:seoOutput&&a11yOutput?'COMPLETED':'PARTIAL',
      seo:seoOutput?{score:seoOutput.score,findings:seoItems,summary:seoOutput.summary}:{status:seo.status,error:seo.error},
      accessibility:a11yOutput?{score:a11yOutput.score,findings:a11yItems,summary:a11yOutput.summary}:{status:a11y.status,error:a11y.error}
    });
  }

  const truncated=found.discoveryTruncated||eligible.length>selected.length;
  return {
    version:1,status:'COMPLETED',networkUsed:false,pagesScanned:selected.length,oversizedFiles:oversized.length,truncated,
    limits:{maxPages,maxBytesPerFile,maxDiscoveredHtml:MAX_DISCOVERED_HTML},
    tools:['seo.audit','web.accessibility.audit'],
    pages,
    summary:{seoFindings,accessibilityFindings,seoErrors,accessibilityErrors}
  };
}
