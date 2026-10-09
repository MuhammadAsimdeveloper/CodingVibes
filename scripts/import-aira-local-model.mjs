import fs from 'node:fs';
import path from 'node:path';

const sourceArg=process.argv[2]||process.env.AIRA_MODEL_PATH||'../Aira/models/base/Qwen3-0.6B-Q4_0.gguf';
const destination=path.resolve(process.env.CODINGVIBES_LOCAL_MODEL_PATH||'models/base/Qwen3-0.6B-Q4_0.gguf');
const source=path.resolve(sourceArg);
if(!fs.existsSync(source))throw new Error('Aira local model not found: '+source);
fs.mkdirSync(path.dirname(destination),{recursive:true});
fs.copyFileSync(source,destination);
console.log(JSON.stringify({ok:true,source,destination,size:fs.statSync(destination).size}));
