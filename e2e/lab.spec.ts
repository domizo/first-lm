import {expect,test} from '@playwright/test';
import type {Page,TestInfo} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
async function screenshot(page:Page,testInfo:TestInfo,name:string){const file=testInfo.outputPath(`${name}.png`);await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:file,fullPage:true});await testInfo.attach(name,{path:file,contentType:'image/png'});}
async function goStep(page:Page,index:number){await page.locator('.workflow-nav button').nth(index).click();}
async function expectNoOverflow(page:Page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();}
test('recorded run: four steps, real inference, bilingual mobile, guide and JSON round trip',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.getByRole('heading',{name:'Training, made visible',exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Run local training',exact:true})).toBeDisabled();await expectNoOverflow(page);
 await screenshot(page,info,'train-desktop-en');
 await page.locator('.checkpoint-labels:visible button').first().click();await expect(page.locator('.sample-label').last()).toContainText('At initialization');
 await page.locator('.checkpoint-labels:visible button').last().click();
 await goStep(page,0);await expect(page.getByRole('heading',{name:'Know what goes in'})).toBeVisible();
 await page.getByRole('button',{name:'Held-out preview',exact:true}).click();await expect(page.locator('.dataset-preview')).not.toBeEmpty();
 await page.getByRole('button',{name:'Edit corpus',exact:true}).click();await expect(page.locator('#corpus-editor')).not.toHaveValue('');
 await page.locator('#corpus-editor').fill('Edited only in the UI');await expect(page.locator('.editor-footer')).toContainText('Edited for the next local run');
 await page.getByRole('button',{name:'Reset text',exact:true}).click();await expect(page.locator('#corpus-editor')).not.toHaveValue('Edited only in the UI');
 await page.getByRole('button',{name:'Training preview',exact:true}).click();await screenshot(page,info,'dataset-desktop-en');
 await goStep(page,1);await page.getByLabel('Try your own text',{exact:true}).fill('the 🦄');await expect(page.locator('.token-chip.unknown')).toHaveCount(1);
 await expect(page.getByText('Characters outside the training vocabulary map to <unk> (ID 0). A tiny model cannot learn characters it has never seen.')).toBeVisible();
 await screenshot(page,info,'tokenize-desktop-en');
 await goStep(page,3);await page.getByLabel('New tokens',{exact:true}).fill('32');await page.getByRole('spinbutton',{name:'Seed',exact:true}).fill('42');
 await page.getByRole('button',{name:'Generate text',exact:true}).click();await expect(page.getByRole('heading',{name:'What could come next?',exact:true})).toBeVisible({timeout:60000});
 const output=await page.locator('.generation-output').innerText();expect(output.length).toBeGreaterThan(3);
 await page.getByRole('button',{name:'Generate text',exact:true}).click();await expect(page.getByRole('button',{name:'Generate text',exact:true})).toBeEnabled({timeout:60000});await expect(page.locator('.generation-output')).toHaveText(output);
 await expect(page.locator('.probabilities')).toContainText('immediately after the original prompt');await screenshot(page,info,'generate-desktop-en');
 await page.getByLabel('Temperature',{exact:true}).fill('0');await page.getByRole('button',{name:'Generate text',exact:true}).click();await expect(page.getByRole('button',{name:'Generate text',exact:true})).toBeEnabled({timeout:60000});
 await page.getByRole('link',{name:'Guide',exact:true}).click();await expect(page).toHaveURL(/#\/learn\/overview$/);await screenshot(page,info,'guide-desktop-en');await page.getByRole('link',{name:'Return to your experiment',exact:true}).click();
 const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Download run',exact:true}).click();const download=await downloadPromise;const downloaded=await download.path();expect(downloaded).toBeTruthy();const json=JSON.parse(await fs.readFile(downloaded!,'utf8'));expect(json.origin).toBe('pytorch');expect(json.checkpoints.length).toBeGreaterThan(1);
 await page.locator('input[type=file]').setInputFiles(downloaded!);await expect(page.getByText('Imported training run',{exact:true})).toBeVisible();await expect(page.locator('.import-notice')).toContainText('not authenticated');
 await page.locator('input[type=file]').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"schemaVersion":0}')});await expect(page.getByRole('alert')).toContainText('version 1 PyTorch');await page.getByRole('button',{name:'Dismiss error'}).click();
 await page.getByRole('button',{name:'JA',exact:true}).click();await goStep(page,2);await expect(page.locator('html')).toHaveAttribute('lang','ja');await screenshot(page,info,'train-desktop-ja');
 await page.setViewportSize({width:390,height:844});await expectNoOverflow(page);await expect.poll(()=>page.locator('.loss-chart svg text').first().evaluate((node:SVGTextElement)=>parseFloat(getComputedStyle(node).fontSize)*(node.getScreenCTM()?.a??0))).toBeGreaterThanOrEqual(11);await expect(page.locator('.loss-chart svg')).toHaveAttribute('viewBox','0 0 350 250');await screenshot(page,info,'train-mobile-ja');
 for(const [index,name] of [[0,'dataset'],[1,'tokenize'],[3,'generate']] as const){await goStep(page,index);await expectNoOverflow(page);await screenshot(page,info,`${name}-mobile-ja`);}
 await page.getByRole('button',{name:'EN',exact:true}).click();await goStep(page,2);await screenshot(page,info,'train-mobile-en');await page.reload();await expect(page.locator('html')).toHaveAttribute('lang','en');expect(errors).toEqual([]);
});

test('late demo response cannot replace a restored local run',async({page})=>{
 const bundle=JSON.parse(await fs.readFile(path.resolve('public/runs/demo.json'),'utf8'));bundle.id='restored-local-run';
 await page.route('**/api/health',route=>route.fulfill({json:{status:'ok',engine:'pytorch'}}));
 await page.route('**/api/status',route=>route.fulfill({json:{status:'completed',runId:bundle.id,metrics:bundle.metrics,bundle,config:bundle.training}}));
 await page.route('**/api/dataset',route=>route.fulfill({json:{text:'local corpus'}}));
 await page.route('**/runs/demo.json',async route=>{await new Promise(r=>setTimeout(r,1200));await route.continue();});
 await page.goto('/');await expect(page.getByText('Local training run',{exact:true})).toBeVisible();await expect(page.getByRole('heading',{name:'Training, made visible',exact:true})).toBeVisible();
 await expect(page.getByText('Recorded training run',{exact:true})).toHaveCount(0);await expect(page.getByRole('button',{name:'Resume latest local run',exact:true})).toBeDisabled();
});

test('an explicit early import wins over pending demo and local restoration',async({page})=>{
 const raw=await fs.readFile(path.resolve('public/runs/demo.json'),'utf8');const imported=JSON.parse(raw);imported.id='user-chosen-import';
 const local=JSON.parse(raw);local.id='late-local-restore';let release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/api/health',route=>route.fulfill({json:{status:'ok',engine:'pytorch'}}));
 await page.route('**/api/status',async route=>{await gate;await route.fulfill({json:{status:'completed',runId:local.id,metrics:local.metrics,bundle:local,config:local.training}});});
 await page.route('**/api/dataset',route=>route.fulfill({json:{text:'late original corpus'}}));
 await page.route('**/runs/demo.json',async route=>{await gate;await route.continue();});
 await page.goto('/');await page.locator('input[type=file]').setInputFiles({name:'chosen.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(imported))});
 await expect(page.getByText('Imported training run',{exact:true})).toBeVisible();await expect(page.getByRole('heading',{name:'Training, made visible',exact:true})).toBeVisible();
 await goStep(page,0);await page.getByRole('button',{name:'Edit corpus',exact:true}).click();await page.locator('#corpus-editor').fill('User edited corpus must survive initialization');
 const responses=[page.waitForResponse('**/runs/demo.json'),page.waitForResponse('**/api/status'),page.waitForResponse('**/api/dataset')];release();await Promise.all((await Promise.all(responses)).map(response=>response.finished()));
 await page.waitForTimeout(500);await expect(page.getByText('Imported training run',{exact:true})).toBeVisible();await expect(page.locator('#corpus-editor')).toHaveValue('User edited corpus must survive initialization');
 const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Download run',exact:true}).click();const file=await (await downloadPromise).path();expect(JSON.parse(await fs.readFile(file!,'utf8')).id).toBe('user-chosen-import');
});

test('local companion: actual training, cancellation, reload and resume',async({page,request},info)=>{
 const previous=await (await request.get('http://127.0.0.1:8765/api/status')).json();if(previous.status==='running'){await request.post('http://127.0.0.1:8765/api/cancel',{data:{}});await expect.poll(async()=>(await (await request.get('http://127.0.0.1:8765/api/status')).json()).status,{timeout:90000}).not.toBe('running');}
 await page.goto('http://127.0.0.1:8765');await expect(page.getByRole('button',{name:'Run local training',exact:true})).toBeEnabled();
 const customCorpus=Array.from({length:24},(_,i)=>`the cat ${i} is calm. the small dog ${i} is kind.\nねこ ${i} は しずかです。`).join('\n\n');await goStep(page,0);await page.getByRole('button',{name:'Edit corpus',exact:true}).click();await page.locator('#corpus-editor').fill(customCorpus);await goStep(page,2);
 await page.getByLabel('Training steps',{exact:true}).fill('12');await page.getByRole('spinbutton',{name:'Seed',exact:true}).fill('13');
 await page.getByText('Model & batch settings',{exact:true}).click();await page.getByLabel('Context length',{exact:true}).fill('8');await page.getByLabel('Embedding width',{exact:true}).selectOption('16');await page.getByLabel('Attention heads',{exact:true}).selectOption('1');await page.getByLabel('Layers',{exact:true}).fill('1');await page.getByLabel('Batch size',{exact:true}).fill('4');await page.getByLabel('Evaluate every',{exact:true}).fill('4');
 await page.getByRole('button',{name:'Run local training',exact:true}).click();
 await expect.poll(async()=>{const r=await request.get('http://127.0.0.1:8765/api/status');return (await r.json()).status;},{timeout:90000}).toBe('completed');
 await expect(page.getByText('Local training run',{exact:true})).toBeVisible();let body=await (await request.get('http://127.0.0.1:8765/api/status')).json();expect(body.bundle.checkpoints.at(-1).step).toBe(12);expect(body.bundle.training.embedDim).toBe(16);expect(body.bundle.metrics.at(-1).trainLoss).toBeLessThan(body.bundle.metrics[0].trainLoss);await screenshot(page,info,'local-trained-desktop');
 await page.getByLabel('Training steps',{exact:true}).fill('1000');await page.getByLabel('Context length',{exact:true}).fill('48');await page.getByLabel('Embedding width',{exact:true}).selectOption('48');await page.getByLabel('Attention heads',{exact:true}).selectOption('4');await page.getByLabel('Layers',{exact:true}).fill('2');await page.getByLabel('Batch size',{exact:true}).fill('16');await page.getByLabel('Evaluate every',{exact:true}).fill('10');
 let starts=0,cancels=0;page.on('request',r=>{if(r.method()==='POST'&&r.url().endsWith('/api/train'))starts++;if(r.method()==='POST'&&r.url().endsWith('/api/cancel'))cancels++;});
 await page.getByRole('button',{name:'Run local training',exact:true}).evaluate((button:HTMLButtonElement)=>{button.click();button.click();});await expect(page.getByText('Live local training',{exact:true})).toBeVisible();
 await screenshot(page,info,'local-training-live');await page.getByRole('button',{name:'Cancel',exact:true}).evaluate((button:HTMLButtonElement)=>{button.click();button.click();});
 await expect.poll(async()=>{return (await (await request.get('http://127.0.0.1:8765/api/status')).json()).status;},{timeout:90000}).toBe('cancelled');
 await expect(page.getByText('Local training run',{exact:true})).toBeVisible();expect(starts).toBe(1);expect(cancels).toBe(1);
 body=await (await request.get('http://127.0.0.1:8765/api/status')).json();const target=Math.min(1000,body.bundle.checkpoints.at(-1).step+8);const id=body.runId;
 await page.reload();await expect(page.getByText('Local training run',{exact:true})).toBeVisible();await goStep(page,0);await page.getByRole('button',{name:'Edit corpus',exact:true}).click();await expect.poll(async()=>await page.locator('#corpus-editor').inputValue()).toContain('the cat 23 is calm');await goStep(page,2);await page.getByLabel('Training steps',{exact:true}).fill(String(target));await expect(page.getByRole('button',{name:'Resume latest local run',exact:true})).toBeEnabled();await page.getByRole('button',{name:'Resume latest local run',exact:true}).click();
 await expect.poll(async()=>{return (await (await request.get('http://127.0.0.1:8765/api/status')).json()).status;},{timeout:90000}).toBe('completed');
 await expect(page.getByText('Local training run',{exact:true})).toBeVisible();body=await (await request.get('http://127.0.0.1:8765/api/status')).json();expect(body.runId).toBe(id);expect(body.bundle.checkpoints.at(-1).step).toBe(target);await screenshot(page,info,'local-resumed-desktop');
});

test('bundled third-party notices: exact served text and bilingual footer access',async({page,request},info)=>{
 const source=await fs.readFile('public/THIRD_PARTY_NOTICES.txt','utf8');const response=await request.get('/THIRD_PARTY_NOTICES.txt');expect(response.status()).toBe(200);expect(await response.text()).toBe(source);const license=await request.get('/LICENSE.txt');expect(license.status()).toBe(200);expect(await license.text()).toBe(await fs.readFile('LICENSE','utf8'));
 await page.goto('/#/learn/overview');const link=page.getByRole('link',{name:'Third-party notices',exact:true});await expect(link).toHaveAttribute('href','./THIRD_PARTY_NOTICES.txt');
 const opened=page.waitForEvent('popup');await link.click();const popup=await opened;await expect(popup.locator('body')).toContainText('react 19.3.0');await expect(popup.locator('body')).toContainText('scheduler 0.28.0');await popup.close();await expect(page).toHaveURL(/#\/learn\/overview$/);
 await page.getByRole('button',{name:'JA',exact:true}).click();await page.setViewportSize({width:390,height:844});await expect(page.getByRole('link',{name:'第三者ライセンス',exact:true})).toBeVisible();await expectNoOverflow(page);const file=info.outputPath('footer-notices-mobile-ja.png');await page.locator('.app-footer').screenshot({path:file});await info.attach('footer-notices-mobile-ja',{path:file,contentType:'image/png'});
});
