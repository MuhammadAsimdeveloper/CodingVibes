import {analyzeRequirements} from './requirements.js';
import {hash} from '../core/hash.js';
const safePath=p=>p.replaceAll('\\','/').replace(/^\/+/, '');
export function buildPlan(requirements, existingFiles=[]){
 const files=new Map(existingFiles.map(f=>[f.path,f])); const ops=[];
 const upsert=(path,content)=>{path=safePath(path); const old=files.get(path); if(old?.content===content)return; ops.push({type:old?'modify':'create',path,content,expectedHash:old?.hash})};
 const spec=requirements;
 upsert('codingvibes.app.json',JSON.stringify(spec,null,2)+'\n');
 upsert('src/generated/routes.js',`export const routes=${JSON.stringify(spec.pages)};\nexport const apiRoutes=${JSON.stringify(spec.apis)};\n`);
 upsert('src/generated/components.js',`export const components=${JSON.stringify(spec.components)};\nexport const designSystem=${JSON.stringify(spec.styling)};\n`);
 upsert('src/generated/data-model.js',`export const dataModel=${JSON.stringify(spec.dataModel)};\n`);
 upsert('test/generated.acceptance.test.js',`import test from 'node:test'; import assert from 'node:assert/strict'; import spec from '../codingvibes.app.json' with {type:'json'}; test('generated specification is internally consistent',()=>{assert.ok(spec.pages.length>0); for(const a of spec.apis)assert.match(a.path,/^\/api\//); assert.ok(spec.acceptance.length>0)});\n`);
 return {id:hash(spec),summary:`Implement ${spec.appType} from the user's requirements`,spec,operations:ops,verification:{commands:['node --check src/generated/routes.js','node --check src/generated/components.js','node --check src/generated/data-model.js','node --test test/generated.acceptance.test.js'],browser:{required:true,paths:spec.pages}}};
}
export async function buildFromRequest(request,{existingFiles=[]}={}){const spec=analyzeRequirements(request);return buildPlan(spec,existingFiles)}
