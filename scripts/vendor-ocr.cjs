// Refresh from the exact locked npm versions. Turkish data is downloaded separately.
const fs=require('node:fs');const path=require('node:path');
const dest='vendor/ocr';fs.mkdirSync(dest,{recursive:true});
const library=fs.readFileSync('node_modules/tesseract.js/dist/tesseract.min.js','utf8');
const before='else r=new Worker(e);return r';
if(library.split(before).length!==2)throw Error('Review Tesseract worker factory before updating');
// Expose the raw worker before initialization so cancel/error/timeout can terminate it.
fs.writeFileSync(path.join(dest,'tesseract.min.js'),library.replace(before,'else r=new Worker(e);return t.onWorker&&t.onWorker(r),r'));
for(const [src,name] of [
 ['tesseract.js/dist/worker.min.js','worker.min.js'],
 ['tesseract.js/LICENSE.md','LICENSE-tesseract.js.md'],
 ['tesseract.js-core/LICENSE','LICENSE-core'],
 ['tesseract.js-core/tesseract-core-lstm.wasm.js','tesseract-core-lstm.wasm.js'],
 ['tesseract.js-core/tesseract-core-lstm.wasm','tesseract-core-lstm.wasm']
])fs.copyFileSync('node_modules/'+src,path.join(dest,name));
