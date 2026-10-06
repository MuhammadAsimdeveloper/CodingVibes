import fs from 'node:fs';
import path from 'node:path';
import {planRequirements} from '../agent/planner.js';
import {runBenchmarkSuite} from './benchmark.js';

const scenarios=JSON.parse(fs.readFileSync(new URL('../../benchmarks/build-vibe-scenarios.json',import.meta.url),'utf8'));
const summary=await runBenchmarkSuite(scenarios,s=>planRequirements(s.request,{targetId:s.targetId}).then(x=>x.spec),{concurrency:Number(process.env.CODINGVIBES_BENCHMARK_CONCURRENCY||4)});
fs.mkdirSync(path.resolve('artifacts'),{recursive:true});
fs.writeFileSync(path.resolve('artifacts','benchmark-results.json'),JSON.stringify(summary,null,2)+'
','utf8');
console.log(JSON.stringify(summary,null,2));
if(summary.count<50||summary.passRate<85)process.exitCode=1;
