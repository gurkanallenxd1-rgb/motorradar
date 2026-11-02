const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');
function runtime({available=true}={}){
 let options,terminated=0,deadline;const worker={terminate(){terminated++},addEventListener(){}};
 const ctx={WebAssembly:available?{}:undefined,Tesseract:{createWorker(l,o,opts){options=opts;opts.onWorker(worker);return new Promise(()=>{})}},document:{baseURI:'https://example.org/motorradar/'},URL,Error,Promise,setTimeout(fn){deadline=fn;return 1},clearTimeout(){}};
 vm.runInNewContext(fs.readFileSync('screenshot-ocr.js','utf8'),ctx);
 return {api:ctx.ScreenshotOCR,options:()=>options,terminated:()=>terminated,timeout:()=>deadline()};
}
const file={type:'image/png',size:100};
test('cancel and timeout terminate worker even before initialization finishes',async()=>{
 for(const action of ['cancel','timeout']){const r=runtime();const task=r.api.start([file],()=>{});assert.equal(r.options().workerPath,'https://example.org/motorradar/vendor/ocr/worker.min.js');assert.equal(r.options().langPath,'https://example.org/motorradar/vendor/ocr/');if(action==='cancel')task.cancel();else r.timeout();await assert.rejects(task.promise,/iptal/);assert.ok(r.terminated()>=1);}
});
test('startup failure reports error and terminates the raw worker',async()=>{const r=runtime();const task=r.api.start([file],()=>{});r.options().errorHandler('failure');await assert.rejects(task.promise,/yüklenemedi/);assert.equal(r.terminated(),1);});
test('missing WebAssembly has manual fallback without spawning a worker',async()=>{const r=runtime({available:false});await assert.rejects(r.api.start([file],()=>{}).promise,/Manuel/);assert.equal(r.options(),undefined);});
test('file limits reject empty, oversized, unsupported and too many files',()=>{const r=runtime();for(const files of [[],Array(7).fill(file),[{...file,size:13*1024*1024}],[{...file,type:'image/heic'}],[{...file,size:0}]])assert.throws(()=>r.api.validate(files));});
