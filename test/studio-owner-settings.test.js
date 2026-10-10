import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();

test('studio exposes project-scoped owner address and consent-aware analytics settings',()=>{
  const html=fs.readFileSync(path.join(root,'public','index.html'),'utf8');
  const js=fs.readFileSync(path.join(root,'public','studio.js'),'utf8');
  assert.match(html,/id="businessAddress"/);
  assert.match(html,/for="businessAddress"/);
  assert.match(html,/id="analyticsMeasurementId"/);
  assert.match(html,/for="analyticsMeasurementId"/);
  assert.match(html,/loads only after analytics consent/i);
  assert.match(js,/buildOptions:new Map\(\)/);
  assert.match(js,/buildVibe\.projectSettings\./);
  assert.match(js,/localStorage\.setItem\('buildVibe\.projectSettings\.'/);
  assert.match(js,/localStorage\.getItem\('buildVibe\.projectSettings\.'/);
  assert.match(js,/function buildRequestWithOptions\(\)/);
  assert.match(js,/Business address is '\+JSON\.stringify\(businessAddress\)/);
  assert.match(js,/Install Google Analytics '\+analyticsMeasurementId\+' after consent/);
  assert.match(js,/Google Analytics ID must look like G-ABCDEF1234/);
});
