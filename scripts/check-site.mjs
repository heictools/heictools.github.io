import {readdir,readFile,stat} from 'node:fs/promises';
import {resolve,relative,dirname} from 'node:path';
const root=resolve('dist');
async function walk(dir){const out=[];for(const item of await readdir(dir,{withFileTypes:true})){const p=resolve(dir,item.name);if(item.isDirectory())out.push(...await walk(p));else out.push(p);}return out;}
const files=(await walk(root)).filter(p=>p.endsWith('.html'));
const titles=new Set(),descriptions=new Set();
for(const file of files){
 const text=await readFile(file,'utf8');
 if((text.match(/<h1[ >]/g)||[]).length!==1)throw new Error(`Expected one H1: ${file}`);
 const title=text.match(/<title>(.*?)<\/title>/)?.[1],description=text.match(/name="description" content="([^"]+)"/)?.[1];
 if(!title||titles.has(title)||!description||descriptions.has(description))throw new Error(`Duplicate or missing SEO metadata: ${file}`);
 titles.add(title);descriptions.add(description);
 for(const match of text.matchAll(/(?:href|src)="([^"]+)"/g)){
  const url=match[1];if(/^(https?:|mailto:|data:|blob:)/.test(url))continue;
  const [path,hash]=url.split('#');let target=path?(path.startsWith('/')?resolve(root,'.'+path):resolve(dirname(file),path)):file;
  try{if((await stat(target)).isDirectory())target=resolve(target,'index.html');await stat(target);}catch{throw new Error(`Broken link ${url} in ${relative(root,file)}`);}
  if(hash&&target.endsWith('.html')){const targetText=await readFile(target,'utf8');if(!targetText.includes(`id="${hash}"`))throw new Error(`Missing anchor ${url} in ${file}`);}
 }
}
console.log(`Checked metadata and local links in ${files.length} HTML pages`);
