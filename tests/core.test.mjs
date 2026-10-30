import {test} from 'node:test';
import assert from 'node:assert/strict';
import {outputName, uniqueNames, dimensions, isHeif, ConversionQueue} from '../src/core.js';
test('filenames retain Unicode and spaces, replace extensions and unsafe paths',()=>{
 assert.equal(outputName('été 🐈.HEIC','-web'),'été 🐈-web.jpg');
 assert.equal(outputName('photo.heif'),'photo.jpg');
 assert.doesNotMatch(outputName('../../photo.heic','/bad'), /[\\/]|^\./);
 assert.equal(outputName('.heic'),'photo.jpg');
});
test('ZIP names are unique including case, Unicode normalization, and pre-numbered names',()=>{
 const input=['a.jpg','A.jpg','a (2).jpg','a.jpg','é.jpg','e\u0301.jpg'];
 const names=uniqueNames(input);
 assert.equal(new Set(names.map(n=>n.normalize('NFC').toLowerCase())).size,input.length);
 assert.deepEqual(names.slice(0,4),['a.jpg','A (2).jpg','a (2) (2).jpg','a (3).jpg']);
});
test('resize preserves aspect ratio and never enlarges',()=>{
 assert.deepEqual(dimensions(4032,3024,{resize:'custom',width:1920,height:1080}),{width:1440,height:1080});
 assert.deepEqual(dimensions(4032,3024,{resize:'1920'}),{width:1920,height:1440});
 assert.deepEqual(dimensions(3,1,{resize:'half'}),{width:2,height:1});
 assert.deepEqual(dimensions(120,80,{resize:'custom',width:1920,height:1080}),{width:120,height:80});
 for(const width of [0,Infinity,NaN,1.5,-1,16385]) assert.throws(()=>dimensions(200,100,{resize:'custom',width,height:100}));
});
test('sniffs container instead of trusting a renamed extension',async()=>{
 assert.equal(await isHeif(new Blob(['not a photo.heic'])),false);
 assert.equal(await isHeif(new Blob(['\0\0\0\x18ftypheic\0\0\0\0mif1'])),true);
 assert.equal(await isHeif(new Blob(['\0\0\0\x18ftypxxxx\0\0\0\0heix'])),true);
});
const file=name=>new File(['sample'],name);
test('queue is sequential, accepts additions during work, continues after failure and releases inputs',async()=>{
 let active=0,max=0;
 const queue=new ConversionQueue(async f=>{
  max=Math.max(max,++active); await new Promise(r=>setTimeout(r,5)); active--;
  if(f.name==='bad.heic') throw new Error('Damaged');
  return {blob:new Blob(['jpg'])};
 });
 queue.add([file('one.heic'),file('bad.heic')]);
 const run=queue.run({suffix:'-copy'}); queue.add([file('three.heic')]); await queue.run({}); await run;
 assert.equal(max,1); assert.deepEqual(queue.items.map(i=>i.status),['done','error','done']);
 assert.equal(queue.items[0].file,null); assert.equal(queue.items[1].file.name,'bad.heic');
 assert.equal(queue.items[0].outputName,'one-copy.jpg'); assert.equal(queue.running,false);
 queue.retry(queue.items[1].id); assert.equal(queue.items[1].status,'queued');
});
test('removing active item aborts it, queue continues, clear releases finished resources',async()=>{
 let released=0;
 const queue=new ConversionQueue((f,s,signal)=>new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>resolve({blob:new Blob(['jpg'])}),15);
  signal.addEventListener('abort',()=>{clearTimeout(timer);reject(new Error('cancelled'));});
 }),()=>{},()=>released++);
 queue.add([file('one.heic'),file('two.heic')]);
 const run=queue.run({});queue.remove(queue.items[0].id);await run;
 assert.equal(queue.items.length,1); assert.equal(queue.items[0].status,'done');queue.clear();assert.equal(released,1);assert.equal(queue.items.length,0);
});
test('late conversion result after removal is released',async()=>{
 let released=0;
 const queue=new ConversionQueue(async()=>{await new Promise(r=>setTimeout(r,5));return {};},()=>{},()=>released++);
 queue.add([file('one.heic')]);const run=queue.run({});queue.clear();await run;assert.equal(released,1);
});
