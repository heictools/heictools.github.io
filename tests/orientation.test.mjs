import {test} from 'node:test';import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {exifFallback,tiffOrientation} from '../src/orientation.js';
test('EXIF fallback rotates standalone EXIF, but never repeats a container transform',async()=>{
 const file=async name=>new Blob([await readFile(`tests/fixtures/${name}`)]);
 assert.equal(await exifFallback(await file('orientation-6.heic')),6);
 assert.equal(await exifFallback(await file('container-6.heic')),1);
 assert.equal(await exifFallback(await file('landscape.heic')),1);
 assert.equal(await exifFallback(await file('corrupt.heic')),1);
 assert.equal(await exifFallback(new Blob(['nonsense'])),1);
});
test('TIFF orientation accepts both byte orders and all eight transforms',()=>{
 for(const little of [true,false])for(let orientation=1;orientation<=8;orientation++) {
  const buffer=new ArrayBuffer(26),v=new DataView(buffer);
  v.setUint16(0,little?0x4949:0x4d4d);v.setUint16(2,42,little);v.setUint32(4,8,little);
  v.setUint16(8,1,little);v.setUint16(10,274,little);v.setUint16(12,3,little);v.setUint32(14,1,little);v.setUint16(18,orientation,little);
  assert.equal(tiffOrientation(buffer),orientation);
 }
});
