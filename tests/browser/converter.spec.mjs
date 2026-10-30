import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {readFile} from 'node:fs/promises';
import JSZip from 'jszip';
const fixture = name => `tests/fixtures/${name}`;
async function input(name='landscape.heic') {return {name,mimeType:'image/heic',buffer:await readFile(fixture('landscape.heic'))};}
async function pixels(page, bytes) {
 return page.evaluate(async data=>{
  const blob=new Blob([new Uint8Array(data)],{type:'image/jpeg'}),bitmap=await createImageBitmap(blob);
  const c=document.createElement('canvas');c.width=bitmap.width;c.height=bitmap.height;const ctx=c.getContext('2d');ctx.drawImage(bitmap,0,0);bitmap.close();
  const pixel=(x,y)=>[...ctx.getImageData(x,y,1,1).data];
  return {width:c.width,height:c.height,topLeft:pixel(100,100),bottomLeft:pixel(100,c.height-60)};
 },[...bytes]);
}
test('real batch conversion, error isolation, Unicode names, JPEG and ZIP contents; no uploads',async({page,context,browserName})=>{
 const requests=[];context.on('request',r=>requests.push({url:r.url(),method:r.method()}));
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 expect(requests.some(r=>r.url.includes('/vendor/'))).toBe(false);
 await page.locator('#files').setInputFiles([await input('été photo.heic'),await input('été photo.heic'),{name:'broken.heif',mimeType:'image/heif',buffer:await readFile(fixture('corrupt.heic'))}]);
 await page.locator('#convert').click();
 await expect(page.locator('[data-status="done"]')).toHaveCount(2);
 await expect(page.locator('[data-status="error"]')).toHaveCount(1);
 await expect(page.locator('#zip')).toBeEnabled();
 const downloadPromise=page.waitForEvent('download');await page.locator('.download').first().click();const download=await downloadPromise;
 await expect(page.locator('.download').first()).toHaveAttribute('download','été photo.jpg');
 expect(download.suggestedFilename()).toBe(browserName === 'webkit' ? 'été_photo.jpg' : 'été photo.jpg');
 const data=await readFile(await download.path());expect([...data.subarray(0,3)]).toEqual([255,216,255]);
 const image=await pixels(page,data);expect(image.width).toBe(480);expect(image.height).toBe(320);expect(image.topLeft[0]).toBeGreaterThan(180);expect(image.topLeft[1]).toBeLessThan(90);
 await page.locator('#zip').click();await expect(page.locator('#save-zip')).toBeVisible();
 const zipPromise=page.waitForEvent('download');await page.locator('#save-zip').click();const zipDownload=await zipPromise;
 const archive=await JSZip.loadAsync(await readFile(await zipDownload.path()));expect(Object.keys(archive.files)).toEqual(['été photo.jpg','été photo (2).jpg']);
 expect(await archive.file('été photo.jpg').async('uint8array')).toEqual(new Uint8Array(data));
 expect(requests.filter(r=>/^https?:/.test(r.url)&&r.method!=='GET')).toEqual([]);
 const origin=new URL(page.url()).origin;expect(requests.filter(r=>/^https?:/.test(r.url)&&new URL(r.url).origin!==origin)).toEqual([]);
 expect(errors).toEqual([]);
 await page.locator('#clear').click();await expect(page.locator('.file-row')).toHaveCount(0);await expect(page.locator('#save-zip')).toBeHidden();
});
test('resizing, suffix, add more, remove and quality settings',async({page})=>{
 await page.goto('/');await page.locator('#files').setInputFiles(fixture('portrait.heif'));
 await page.locator('#files').setInputFiles(fixture('landscape.heic'));
 await expect(page.locator('.file-row')).toHaveCount(2);
 await page.getByRole('button',{name:'Remove portrait.heif',exact:true}).click();
 await page.locator('#resize').selectOption('custom');await page.locator('#width').fill('200');await page.locator('#height').fill('100');await page.locator('#suffix').fill('-small');
 await page.locator('#quality').fill('60');await page.locator('#quality').dispatchEvent('input');await expect(page.locator('#quality-value')).toHaveText('60%');
 await page.locator('#convert').click();await expect(page.locator('[data-status="done"]')).toHaveCount(1);
 const p=page.waitForEvent('download');await page.locator('.download').click();const d=await p;expect(d.suggestedFilename()).toBe('landscape-small.jpg');
 const image=await pixels(page,await readFile(await d.path()));expect([image.width,image.height]).toEqual([150,100]);
});
test('portrait, orientation, ICC and large HEIC decode; output strips original metadata',async({page})=>{
 await page.goto('/');await page.locator('#files').setInputFiles(['portrait.heif','orientation-6.heic','srgb.heic','large.heic','container-6.heic'].map(fixture));
 await page.locator('#resize').selectOption('1920');await page.locator('#convert').click();await expect(page.locator('[data-status="done"]')).toHaveCount(5,{timeout:80000});
 const rows=page.locator('.file-row');await expect(rows.nth(0)).toContainText('320 × 480');await expect(rows.nth(1)).toContainText('320 × 480');await expect(rows.nth(3)).toContainText('1920 × 1280');await expect(rows.nth(4)).toContainText('320 × 480');
 const p=page.waitForEvent('download');await rows.nth(1).locator('.download').click();const d=await p;const data=await readFile(await d.path());
 expect(data.includes(Buffer.from('Synthetic HEIC Tools fixture'))).toBe(false);expect(data.includes(Buffer.from('Exif\0\0'))).toBe(false);
 const image=await pixels(page,data);expect(image.topLeft[0]).toBeGreaterThan(150);expect(image.topLeft[1]).toBeGreaterThan(130); // rotated yellow quadrant
});
test('clear cancels active work and does not resurrect results; new batch works',async({page})=>{
 await page.goto('/');await page.locator('#files').setInputFiles([fixture('large.heic'),fixture('landscape.heic')]);await page.locator('#convert').click();await page.locator('#clear').click();
 await expect(page.locator('.file-row')).toHaveCount(0);await page.locator('#files').setInputFiles(fixture('landscape.heic'));await expect(page.locator('#convert')).toBeEnabled();await page.locator('#convert').click();await expect(page.locator('[data-status="done"]')).toHaveCount(1);
});
test('static content, keyboard access, responsive layout, and accessibility',async({page})=>{
 await page.goto('/');await expect(page.locator('h1')).toHaveCount(1);
 await page.keyboard.press('Tab');await expect(page.getByRole('link',{name:'Skip to content'})).toBeFocused();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(results.violations).toEqual([]);
 await page.locator('#files').setInputFiles(fixture('landscape.heic'));await page.locator('#convert').click();await expect(page.locator('[data-status="done"]')).toHaveCount(1);
 expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
});
