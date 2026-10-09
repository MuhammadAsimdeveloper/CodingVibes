import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeAssistantMode,shouldApplyAssistantMode} from '../src/assistant/runtime.js';

test('assistant modes distinguish discuss from build',()=>{
 assert.equal(normalizeAssistantMode('discuss'),'discuss');
 assert.equal(normalizeAssistantMode('build'),'build');
 assert.equal(shouldApplyAssistantMode('discuss','make the buttons blue'),false);
 assert.equal(shouldApplyAssistantMode('build','make the buttons blue'),true);
});
