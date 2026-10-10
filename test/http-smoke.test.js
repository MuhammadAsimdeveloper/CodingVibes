import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { httpSmoke } from '../src/verification/http.js';

test('HTTP smoke checks can require an exact status for unknown-route verification',async()=>{
  const server=http.createServer((req,res)=>{
    if(req.url==='/known'){res.writeHead(200,{'content-type':'text/plain'});res.end('ok');return;}
    res.writeHead(404,{'content-type':'text/plain'});res.end('not found');
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  const address=server.address();
  try {
    const report=await httpSmoke('http://127.0.0.1:'+address.port,[{path:'/known',method:'GET'},{path:'/unknown',method:'GET',expectedStatus:404}]);
    assert.equal(report.passed,true);
    assert.equal(report.results[1].status,404);
    assert.equal(report.results[1].expectedStatus,404);
    assert.equal(report.results[1].ok,true);
  } finally {
    await new Promise(resolve=>server.close(resolve));
  }
});
