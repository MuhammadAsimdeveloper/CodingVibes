import test from 'node:test';
import assert from 'node:assert/strict';
import {answerBuildVibeQuestion} from '../src/assistant/runtime.js';

test('assistant uses project diagnostics when user asks why the build is broken',()=>{
 const r=answerBuildVibeQuestion('why is my project broken?',{latestRun:{id:'r1',status:'failed'},diagnostics:{status:'attention',findings:[{severity:'high',title:'console-errors',message:'Console error in preview'}]}});
 assert.equal(r.mode,'help');
 assert.match(r.reply,/console error/i);
});

test('assistant can explain the current project state and chat history',()=>{
 const r=answerBuildVibeQuestion('what is the current status of my project?',{latestRun:{id:'r1',status:'verified'},chatCount:4});
 assert.match(r.reply,/verified/i);
 assert.match(r.reply,/4/);
});
