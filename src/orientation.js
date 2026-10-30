// Inspect primary-item properties, not arbitrary byte strings or thumbnail transforms.
function boxes(view, start, end) {
  const result=[];
  for(let at=start; at+8<=end;) {
    let size=view.getUint32(at), header=8;
    const type=String.fromCharCode(...new Uint8Array(view.buffer,view.byteOffset+at+4,4));
    if(size===1) {if(at+16>end) break;size=Number(view.getBigUint64(at+8));header=16;}
    if(size===0)size=end-at;
    if(!Number.isSafeInteger(size)||size<header||at+size>end)break;
    result.push({type,start:at+header,end:at+size});at+=size;
  }
  return result;
}
export function hasPrimaryTransform(buffer) {
 const v=new DataView(buffer), children=boxes(v,4,v.byteLength);
 const primary=children.find(b=>b.type==='pitm'), properties=children.find(b=>b.type==='iprp');
 if(!primary||!properties)return false;
 const primaryId=v.getUint8(primary.start)===0?v.getUint16(primary.start+4):v.getUint32(primary.start+4);
 const props=boxes(v,properties.start,properties.end), ipco=props.find(b=>b.type==='ipco');
 if(!ipco)return false;
 const types=boxes(v,ipco.start,ipco.end).map(b=>b.type);
 for(const ipma of props.filter(b=>b.type==='ipma')) {
   const version=v.getUint8(ipma.start), wide=(v.getUint32(ipma.start)&1)!==0;
   let at=ipma.start+4;const count=v.getUint32(at);at+=4;
   for(let i=0;i<count && at<ipma.end;i++) {
     const id=version<1?v.getUint16(at):v.getUint32(at);at+=version<1?2:4;
     const n=v.getUint8(at++);
     for(let j=0;j<n;j++) {
       const index=wide?(v.getUint16(at)&0x7fff):(v.getUint8(at)&0x7f);at+=wide?2:1;
       if(id===primaryId&&['irot','imir'].includes(types[index-1]))return true;
     }
   }
 }
 return false;
}
async function metadata(file) {
 for(let at=0;at+8<=file.size;) {
  const header=new DataView(await file.slice(at,at+16).arrayBuffer());
  let size=header.getUint32(0),start=8;
  const type=String.fromCharCode(...new Uint8Array(header.buffer,4,4));
  if(size===1){size=Number(header.getBigUint64(8));start=16;}
  if(size===0)size=file.size-at;
  if(!Number.isSafeInteger(size)||size<start||at+size>file.size)break;
  if(type==='meta') {
    if(size>16*1024*1024)return null;
    return {buffer:await file.slice(at+start,at+size).arrayBuffer(),offset:at+start};
  }
  at+=size;
 }
 return null;
}
export function tiffOrientation(buffer) {
 const v=new DataView(buffer);
 if(v.byteLength<8)return 1;
 const marker=v.getUint16(0),little=marker===0x4949;
 if(!little&&marker!==0x4d4d)return 1;
 if(v.getUint16(2,little)!==42)return 1;
 const ifd=v.getUint32(4,little),count=v.getUint16(ifd,little);
 for(let i=0;i<count;i++) {
  const at=ifd+2+i*12;
  if(v.getUint16(at,little)===274 && v.getUint16(at+2,little)===3 && v.getUint32(at+4,little)===1) {
   const n=v.getUint16(at+8,little);return n>=1&&n<=8?n:1;
  }
 }
 return 1;
}
async function readExif(file,meta) {
 const v=new DataView(meta.buffer),children=boxes(v,4,v.byteLength),iinf=children.find(b=>b.type==='iinf'),iloc=children.find(b=>b.type==='iloc');
 if(!iinf||!iloc)return null;
 const exifIds=boxes(v,iinf.start+4+(v.getUint8(iinf.start)===0?2:4),iinf.end).filter(b=>b.type==='infe').flatMap(b=>{
  const version=v.getUint8(b.start),idBytes=version===3?4:2;
  if(version<2)return [];
  const type=String.fromCharCode(...new Uint8Array(meta.buffer,b.start+4+idBytes+2,4));
  return type==='Exif'?[idBytes===4?v.getUint32(b.start+4):v.getUint16(b.start+4)]:[];
 });
 // Multiple metadata items can describe different images. Use only a single unambiguous item.
 if(exifIds.length!==1)return null;
 let at=iloc.start;
 const version=v.getUint8(at);at+=4;
 const sizes=v.getUint8(at++),baseSizes=v.getUint8(at++);
 const offsetSize=sizes>>4,lengthSize=sizes&15,baseSize=baseSizes>>4,indexSize=version>0?baseSizes&15:0;
 const read=size=>{let n=0;for(let i=0;i<size;i++)n=n*256+v.getUint8(at++);if(!Number.isSafeInteger(n))throw new Error('Metadata integer too large');return n;};
 const count=read(version<2?2:4);
 for(let i=0;i<count;i++) {
  const id=read(version<2?2:4),method=version>0?read(2)&15:0,reference=read(2),base=read(baseSize),extentCount=read(2);
  const extents=[];
  for(let j=0;j<extentCount;j++){read(indexSize);extents.push({offset:read(offsetSize),length:read(lengthSize)});}
  if(id!==exifIds[0])continue;
  if(reference!==0||method>1)return null;
  const idat=children.find(b=>b.type==='idat');
  if(method===1&&!idat)return null;
  let total=0;const parts=[];
  for(const extent of extents) {
   total+=extent.length;if(total>16*1024*1024)return null;
   const start=base+extent.offset+(method===1?meta.offset+idat.start:0);
   if(start+extent.length>file.size)return null;
   parts.push(await file.slice(start,start+extent.length).arrayBuffer());
  }
  const data=new Uint8Array(total);let pos=0;for(const part of parts){data.set(new Uint8Array(part),pos);pos+=part.byteLength;}
  if(data.length<4)return null;
  const tiffStart=4+new DataView(data.buffer).getUint32(0);
  return data.buffer.slice(tiffStart);
 }
 return null;
}
export async function exifFallback(file) {
 try {
  const meta=await metadata(file);
  if(!meta||hasPrimaryTransform(meta.buffer))return 1;
  const tiff=await readExif(file,meta);
  return tiff?tiffOrientation(tiff):1;
 } catch {return 1;} // Malformed optional metadata must not prevent pixel conversion.
}
