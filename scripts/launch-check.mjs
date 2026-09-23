const base=process.env.CODINGVIBES_URL||'http://127.0.0.1:4400';
const r=await fetch(`${base}/ready`);const body=await r.json();
console.log(JSON.stringify(body,null,2));
if(!body.ready)process.exitCode=2;
