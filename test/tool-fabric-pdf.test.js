import test from 'node:test';
import assert from 'node:assert/strict';
import {getToolContract,listToolContracts,runTool} from '../src/tool-fabric/index.js';

const PDF_ALPHA='JVBERi0xLjMKJZOMi54gUmVwb3J0TGFiIEdlbmVyYXRlZCBQREYgZG9jdW1lbnQgKG9wZW5zb3VyY2UpCjEgMCBvYmoKPDwKL0YxIDIgMCBSCj4+CmVuZG9iagoyIDAgb2JqCjw8Ci9CYXNlRm9udCAvSGVsdmV0aWNhIC9FbmNvZGluZyAvV2luQW5zaUVuY29kaW5nIC9OYW1lIC9GMSAvU3VidHlwZSAvVHlwZTEgL1R5cGUgL0ZvbnQKPj4KZW5kb2JqCjMgMCBvYmoKPDwKL0NvbnRlbnRzIDcgMCBSIC9NZWRpYUJveCBbIDAgMCA2MTIgNzkyIF0gL1BhcmVudCA2IDAgUiAvUmVzb3VyY2VzIDw8Ci9Gb250IDEgMCBSIC9Qcm9jU2V0IFsgL1BERiAvVGV4dCAvSW1hZ2VCIC9JbWFnZUMgL0ltYWdlSSBdCj4+IC9Sb3RhdGUgMCAvVHJhbnMgPDwKCj4+IAogIC9UeXBlIC9QYWdlCj4+CmVuZG9iago0IDAgb2JqCjw8Ci9QYWdlTW9kZSAvVXNlTm9uZSAvUGFnZXMgNiAwIFIgL1R5cGUgL0NhdGFsb2cKPj4KZW5kb2JqCjUgMCBvYmoKPDwKL0F1dGhvciAoQnVpbGQgVmliZSBGaXh0dXJlKSAvQ3JlYXRpb25EYXRlIChEOjIwMjYxMDA5MjA0OTM4KzAwJzAwJykgL0NyZWF0b3IgKGFub255bW91cykgL0tleXdvcmRzICgpIC9Nb2REYXRlIChEOjIwMjYxMDA5MjA0OTM4KzAwJzAwJykgL1Byb2R1Y2VyIChSZXBvcnRMYWIgUERGIExpYnJhcnkgLSBcKG9wZW5zb3VyY2VcKSkgCiAgL1N1YmplY3QgKFBERiB0b29sIHRlc3QgZml4dHVyZSkgL1RpdGxlIChGaXh0dXJlIEFscGhhKSAvVHJhcHBlZCAvRmFsc2UKPj4KZW5kb2JqCjYgMCBvYmoKPDwKL0NvdW50IDEgL0tpZHMgWyAzIDAgUiBdIC9UeXBlIC9QYWdlcwo+PgplbmRvYmoKNyAwIG9iago8PAovTGVuZ3RoIDExMgo+PgpzdHJlYW0KMSAwIDAgMSAwIDAgY20gIEJUIC9GMSAxMiBUZiAxNC40IFRMIEVUCkJUIC9GMSAxMiBUZiAxNC40IFRMIEVUCkJUIDEgMCAwIDEgNzIgNzIwIFRtIChGaXh0dXJlIEFscGhhKSBUaiBUKiBFVAogCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDgKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDYxIDAwMDAwIG4gCjAwMDAwMDAwOTIgMDAwMDAgbiAKMDAwMDAwMDE5OSAwMDAwMCBuIAowMDAwMDAwMzkyIDAwMDAwIG4gCjAwMDAwMDA0NjAgMDAwMDAgbiAKMDAwMDAwMDc0NSAwMDAwMCBuIAowMDAwMDAwODA0IDAwMDAwIG4gCnRyYWlsZXIKPDwKL0lEIApbPDNiYzc5Mjc4YTZiZWI0MjEzMTlkOTUwNGEzODAwNTM0PjwzYmM3OTI3OGE2YmViNDIxMzE5ZDk1MDRhMzgwMDUzND5dCiUgUmVwb3J0TGFiIGdlbmVyYXRlZCBQREYgZG9jdW1lbnQgLS0gZGlnZXN0IChvcGVuc291cmNlKQoKL0luZm8gNSAwIFIKL1Jvb3QgNCAwIFIKL1NpemUgOAo+PgpzdGFydHhyZWYKOTY2CiUlRU9GCg==';
const PDF_BETA='JVBERi0xLjMKJZOMi54gUmVwb3J0TGFiIEdlbmVyYXRlZCBQREYgZG9jdW1lbnQgKG9wZW5zb3VyY2UpCjEgMCBvYmoKPDwKL0YxIDIgMCBSCj4+CmVuZG9iagoyIDAgb2JqCjw8Ci9CYXNlRm9udCAvSGVsdmV0aWNhIC9FbmNvZGluZyAvV2luQW5zaUVuY29kaW5nIC9OYW1lIC9GMSAvU3VidHlwZSAvVHlwZTEgL1R5cGUgL0ZvbnQKPj4KZW5kb2JqCjMgMCBvYmoKPDwKL0NvbnRlbnRzIDggMCBSIC9NZWRpYUJveCBbIDAgMCA2MTIgNzkyIF0gL1BhcmVudCA3IDAgUiAvUmVzb3VyY2VzIDw8Ci9Gb250IDEgMCBSIC9Qcm9jU2V0IFsgL1BERiAvVGV4dCAvSW1hZ2VCIC9JbWFnZUMgL0ltYWdlSSBdCj4+IC9Sb3RhdGUgMCAvVHJhbnMgPDwKCj4+IAogIC9UeXBlIC9QYWdlCj4+CmVuZG9iago0IDAgb2JqCjw8Ci9Db250ZW50cyA5IDAgUiAvTWVkaWFCb3ggWyAwIDAgNjEyIDc5MiBdIC9QYXJlbnQgNyAwIFIgL1Jlc291cmNlcyA8PAovRm9udCAxIDAgUiAvUHJvY1NldCBbIC9QREYgL1RleHQgL0ltYWdlQiAvSW1hZ2VDIC9JbWFnZUkgXQo+PiAvUm90YXRlIDAgL1RyYW5zIDw8Cgo+PiAKICAvVHlwZSAvUGFnZQo+PgplbmRvYmoKNSAwIG9iago8PAovUGFnZU1vZGUgL1VzZU5vbmUgL1BhZ2VzIDcgMCBSIC9UeXBlIC9DYXRhbG9nCj4+CmVuZG9iago2IDAgb2JqCjw8Ci9BdXRob3IgKEJ1aWxkIFZpYmUgRml4dHVyZSkgL0NyZWF0aW9uRGF0ZSAoRDoyMDI2MTAwOTIwNDkzOCswMCcwMCcpIC9DcmVhdG9yIChhbm9ueW1vdXMpIC9LZXl3b3JkcyAoKSAvTW9kRGF0ZSAoRDoyMDI2MTAwOTIwNDkzOCswMCcwMCcpIC9Qcm9kdWNlciAoUmVwb3J0TGFiIFBERiBMaWJyYXJ5IC0gXChvcGVuc291cmNlXCkpIAogIC9TdWJqZWN0IChQREYgdG9vbCB0ZXN0IGZpeHR1cmUpIC9UaXRsZSAoRml4dHVyZSBCZXRhKSAvVHJhcHBlZCAvRmFsc2UKPj4KZW5kb2JqCjcgMCBvYmoKPDwKL0NvdW50IDIgL0tpZHMgWyAzIDAgUiA0IDAgUiBdIC9UeXBlIC9QYWdlcwo+PgplbmRvYmoKOCAwIG9iago8PAovTGVuZ3RoIDExOAo+PgpzdHJlYW0KMSAwIDAgMSAwIDAgY20gIEJUIC9GMSAxMiBUZiAxNC40IFRMIEVUCkJUIC9GMSAxMiBUZiAxNC40IFRMIEVUCkJUIDEgMCAwIDEgNzIgNzIwIFRtIChGaXh0dXJlIEJldGEgUGFnZSAxKSBUaiBUKiBFVAogCmVuZHN0cmVhbQplbmRvYmoKOSAwIG9iago8PAovTGVuZ3RoIDExOAo+PgpzdHJlYW0KMSAwIDAgMSAwIDAgY20gIEJUIC9GMSAxMiBUZiAxNC40IFRMIEVUCkJUIC9GMSAxMiBUZiAxNC40IFRMIEVUCkJUIDEgMCAwIDEgNzIgNzIwIFRtIChGaXh0dXJlIEJldGEgUGFnZSAyKSBUaiBUKiBFVAogCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDEwCjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDA2MSAwMDAwMCBuIAowMDAwMDAwMDkyIDAwMDAwIG4gCjAwMDAwMDAxOTkgMDAwMDAgbiAKMDAwMDAwMDM5MiAwMDAwMCBuIAowMDAwMDAwNTg1IDAwMDAwIG4gCjAwMDAwMDA2NTMgMDAwMDAgbiAKMDAwMDAwMDkzNyAwMDAwMCBuIAowMDAwMDAxMDAyIDAwMDAwIG4gCjAwMDAwMDExNzAgMDAwMDAgbiAKdHJhaWxlcgo8PAovSUQgCls8ZmVjMzhhMTcxNGVkODk0MTRmNDVkYTlhODNjMTc4Nzg+PGZlYzM4YTE3MTRlZDg5NDE0ZjQ1ZGE5YTgzYzE3ODc4Pl0KJSBSZXBvcnRMYWIgZ2VuZXJhdGVkIFBERiBkb2N1bWVudCAtLSBkaWdlc3QgKG9wZW5zb3VyY2UpCgovSW5mbyA2IDAgUgovUm9vdCA1IDAgUgovU2l6ZSAxMAo+PgpzdGFydHhyZWYKMTMzOAolJUVPRgo=';
const REQUIRED_TOOLS=['pdf.info','pdf.merge','pdf.split','pdf.rotate'];

test('PDF tools expose real local-only contracts with bounded document processing',()=>{
  for(const id of REQUIRED_TOOLS){
    const contract=getToolContract(id);
    assert.ok(contract,'missing contract: '+id);
    assert.equal(contract.executionMode,'local');
    assert.equal(contract.networkRequired,false);
    assert.equal(contract.authRequired,false);
    assert.equal(contract.status,'READY');
    assert.equal(contract.inputSchema.type,'object');
  }
  assert.equal(listToolContracts().length,48);
  assert.equal(listToolContracts({category:'Documents'}).filter(t=>t.id.startsWith('pdf.')).length,4);
});

test('PDF info reads page count, metadata and page sizes from a real PDF fixture',async()=>{
  const result=await runTool('pdf.info',{pdfBase64:PDF_ALPHA});
  assert.equal(result.status,'COMPLETED');
  assert.equal(result.output.pageCount,1);
  assert.equal(result.output.metadata.title,'Fixture Alpha');
  assert.equal(result.output.metadata.author,'Build Vibe Fixture');
  assert.equal(result.output.pageSizes[0].width,612);
  assert.equal(result.output.pageSizes[0].height,792);
  assert.equal(result.networkUsed,false);
});

test('PDF merge combines actual PDF pages and returns a valid readable PDF',async()=>{
  const merged=await runTool('pdf.merge',{documents:[{name:'alpha.pdf',pdfBase64:PDF_ALPHA},{name:'beta.pdf',pdfBase64:PDF_BETA}]});
  assert.equal(merged.status,'COMPLETED');
  assert.equal(merged.output.pageCount,3);
  assert.match(merged.output.pdfBase64,/^JVBERi0/);
  const reopened=await runTool('pdf.info',{pdfBase64:merged.output.pdfBase64});
  assert.equal(reopened.status,'COMPLETED');
  assert.equal(reopened.output.pageCount,3);
});

test('PDF split selects one-based page numbers and emits one-page PDF outputs',async()=>{
  const split=await runTool('pdf.split',{pdfBase64:PDF_BETA,pages:[2,1]});
  assert.equal(split.status,'COMPLETED');
  assert.equal(split.output.documents.length,2);
  assert.deepEqual(split.output.documents.map(x=>x.page),[2,1]);
  for(const doc of split.output.documents){
    const info=await runTool('pdf.info',{pdfBase64:doc.pdfBase64});
    assert.equal(info.status,'COMPLETED');
    assert.equal(info.output.pageCount,1);
  }
});

test('PDF rotate permits only right-angle rotations and reports changed page indices',async()=>{
  const rotated=await runTool('pdf.rotate',{pdfBase64:PDF_BETA,angle:90,pages:[1]});
  assert.equal(rotated.status,'COMPLETED');
  assert.deepEqual(rotated.output.rotatedPages,[1]);
  const info=await runTool('pdf.info',{pdfBase64:rotated.output.pdfBase64});
  assert.equal(info.status,'COMPLETED');
  assert.equal(info.output.pageRotations[0],90);
  assert.equal(info.output.pageRotations[1],0);
});

test('PDF tools reject malformed inputs, invalid page ranges and over-budget documents',async()=>{
  assert.equal((await runTool('pdf.info',{pdfBase64:'not base64'})).status,'INVALID_INPUT');
  assert.equal((await runTool('pdf.info',{pdfBase64:Buffer.from('not a pdf').toString('base64')})).status,'INVALID_INPUT');
  assert.equal((await runTool('pdf.merge',{documents:[{pdfBase64:PDF_ALPHA}]})).status,'INVALID_INPUT');
  assert.equal((await runTool('pdf.split',{pdfBase64:PDF_BETA,pages:[]})).status,'INVALID_INPUT');
  assert.equal((await runTool('pdf.split',{pdfBase64:PDF_BETA,pages:[0]})).status,'INVALID_INPUT');
  assert.equal((await runTool('pdf.split',{pdfBase64:PDF_BETA,pages:[1,1]})).status,'INVALID_INPUT');
  assert.equal((await runTool('pdf.rotate',{pdfBase64:PDF_BETA,angle:45})).status,'INVALID_INPUT');
  assert.equal((await runTool('pdf.rotate',{pdfBase64:PDF_BETA,angle:90,pages:[3]})).status,'INVALID_INPUT');
  assert.equal((await runTool('pdf.info',{pdfBase64:PDF_ALPHA.repeat(1000)})).status,'INVALID_INPUT');
  for(const id of REQUIRED_TOOLS){
    const result=await runTool(id,{});
    assert.notEqual(result.status,'COMPLETED',id+' must validate its required input');
    assert.equal(result.networkUsed,false);
  }
});
