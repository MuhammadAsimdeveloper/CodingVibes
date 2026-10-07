import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createStudioState,
  registerProjectWindow,
  beginProjectBuild,
  routeBuildEvent,
  finishProjectBuild,
  isProjectBuilding,
  visibleProjectWindows,
} from '../public/studio-runtime.js';

test('simultaneous project builds remain isolated by project id',()=>{
  const state=createStudioState();
  registerProjectWindow(state,{id:'project-a',name:'Alpha'});
  registerProjectWindow(state,{id:'project-b',name:'Beta'});

  beginProjectBuild(state,'project-a','run-a');
  beginProjectBuild(state,'project-b','run-b');

  assert.equal(isProjectBuilding(state,'project-a'),true);
  assert.equal(isProjectBuilding(state,'project-b'),true);
  assert.equal(state.windows.get('project-a').runId,'run-a');
  assert.equal(state.windows.get('project-b').runId,'run-b');

  routeBuildEvent(state,'project-a',{type:'completed',result:{runId:'run-a',status:'verified'}});
  assert.equal(state.windows.get('project-a').status,'verified');
  assert.equal(state.windows.get('project-b').status,'building');
  assert.equal(isProjectBuilding(state,'project-a'),false);
  assert.equal(isProjectBuilding(state,'project-b'),true);

  finishProjectBuild(state,'project-b','failed');
  assert.equal(state.windows.get('project-b').status,'failed');
  assert.equal(isProjectBuilding(state,'project-b'),false);
});

test('window list keeps every active project but caps rendered windows deterministically',()=>{
  const state=createStudioState();
  for(let i=0;i<16;i++)registerProjectWindow(state,{id:'p'+i,name:'Project '+i});
  const visible=visibleProjectWindows(state,8);
  assert.equal(visible.length,8);
  assert.equal(visible[0].id,'p0');
  assert.equal(visible[7].id,'p7');
});
