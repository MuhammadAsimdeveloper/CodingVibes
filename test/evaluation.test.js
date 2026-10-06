import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreBenchmarkScenario,benchmarkSummary,runBenchmarkSuite} from '../src/evaluation/benchmark.js';

test('benchmark scoring rewards target, pages, acceptance and SEO completeness',()=>{
  const good=scoreBenchmarkScenario({id:'good',request:'x',targetId:'web-node'},{version:3,target:'web-node',pages:['/','/pricing'],acceptance:['responsive','accessible'],seo:{titles:true,canonicals:true,jsonLd:true,robots:true,sitemap:true,descriptions:true}});
  assert.equal(good.passed,true);
  assert.equal(good.score,100);
  const weak=scoreBenchmarkScenario({id:'weak',request:'x',targetId:'web-node'},{version:3,target:'web-node',pages:[],acceptance:[],seo:{}});
  assert.equal(weak.passed,false);
  assert.ok(weak.score<70);
});

test('benchmark summary aggregates deterministic suite results',()=>{
  const summary=benchmarkSummary([{score:100,passed:true},{score:80,passed:true},{score:40,passed:false}]);
  assert.equal(summary.count,3);
  assert.equal(summary.passed,2);
  assert.equal(summary.passRate,66.67);
  assert.equal(summary.averageScore,73.33);
});

test('benchmark runner executes all scenarios with bounded concurrency',async()=>{
  const scenarios=Array.from({length:5},(_,i)=>({id:'s'+i,request:'Build a portfolio website',targetId:'web-node'}));
  const summary=await runBenchmarkSuite(scenarios,async()=>({version:3,target:'web-node',pages:['/'],acceptance:['responsive'],seo:{titles:true,canonicals:true,jsonLd:true,robots:true,sitemap:true}}),{concurrency:2});
  assert.equal(summary.count,5);
  assert.equal(summary.passRate,100);
});

