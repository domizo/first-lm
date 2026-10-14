import {expect,test} from '@playwright/test';
import type {Locator,Page,TestInfo} from '@playwright/test';
async function noOverflow(page:Page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();}
async function capture(locator:Locator,info:TestInfo,name:string){const path=info.outputPath(`${name}.png`);await locator.screenshot({path});await info.attach(name,{path,contentType:'image/png'});}
async function chapter(page:Page,id:string){await page.locator(`.learning-toc a[href="#/learn/${id}"]`).click();}
async function ribbonGeometry(page:Page){
  const errors=await page.locator('.probability-ribbon').evaluate(element=>{
    const ribbon=element as HTMLElement,rect=ribbon.getBoundingClientRect();
    return Array.from(ribbon.querySelectorAll(':scope > span')).flatMap(node=>{
      const item=node as HTMLElement,box=item.getBoundingClientRect();
      const left=rect.x+ribbon.clientLeft+ribbon.clientWidth*parseFloat(item.style.left)/100;
      const width=ribbon.clientWidth*parseFloat(item.style.width)/100;
      return Math.abs(box.x-left)>.1||Math.abs(box.width-width)>.1?[{left:box.x,expectedLeft:left,width:box.width,expectedWidth:width}]:[];
    });
  });expect(errors).toEqual([]);
}

test('interactive illustrations: keyboard windows, loss, bounded updates and reduced-motion mobile',async({page},info)=>{
  const errors:string[]=[],posts:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()==='POST')posts.push(r.url());});
  await page.goto('/#/learn/attention');
  const boundary=page.getByRole('slider',{name:'Last input position in the whole text',exact:true});
  await boundary.focus();await page.keyboard.press('Home');await expect(page.locator('.context-crop li')).toHaveCount(1);await expect(page.locator('.context-crop')).toContainText('<bos>');
  await page.keyboard.press('End');await page.getByRole('slider',{name:'Example window size (tokens)',exact:true}).focus();await page.keyboard.press('Home');
  await expect(page.locator('.context-crop li')).toHaveCount(3);await expect(page.locator('.context-explorer .diagram-result')).toContainText('positions 9–11');await expect(page.locator('.context-crop')).toContainText('Window position 0');
  await noOverflow(page);await capture(page.locator('.beginner-diagram'),info,'interactive-context-desktop-en');
  await chapter(page,'loss');const probability=page.getByRole('slider',{name:/Chance of the correct letter t/});await probability.focus();await page.keyboard.press('Home');await expect(page.locator('.toy-loss-result')).toContainText('4.6052');await page.keyboard.press('End');await expect(page.locator('.toy-loss-result')).toContainText('0.0101');
  await page.keyboard.press('Home');for(let i=0;i<69;i++)await page.keyboard.press('ArrowRight');await expect(page.locator('.toy-loss-result')).toContainText('0.3567');await capture(page.locator('.beginner-diagram'),info,'interactive-loss-desktop-en');
  await chapter(page,'optimization');await page.getByRole('button',{name:'Update once',exact:true}).focus();await page.keyboard.press('Enter');await expect(page.locator('.toy-step-readout')).toContainText('Updates: 1 / 10');
  const firstStep=await page.locator('.toy-step-readout').innerText();await page.getByRole('slider',{name:/Next update size/}).focus();await page.keyboard.press('End');await expect(page.locator('.toy-step-readout')).toHaveText(firstStep);
  await page.getByRole('button',{name:'Update once',exact:true}).click();await expect(page.locator('.toy-step-readout')).toContainText('rate 2.0');for(let i=0;i<8;i++)await page.getByRole('button',{name:'Update once',exact:true}).click();await expect(page.getByRole('button',{name:'Update once',exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'Start over',exact:true}).click();await expect(page.locator('.toy-step-readout')).toContainText('Updates: 0 / 10');await page.getByRole('button',{name:'Update once',exact:true}).click();await capture(page.locator('[data-toy-mode="update"]'),info,'interactive-update-desktop-en');
  await page.getByRole('button',{name:'JA',exact:true}).click();await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:390,height:844});
  for(const id of ['attention','loss','optimization']){await chapter(page,id);if(id==='optimization')await page.getByRole('button',{name:'1回更新する',exact:true}).click();await noOverflow(page);await capture(page.locator('.beginner-diagram'),info,`interactive-${id}-mobile-ja`);}
  await page.setViewportSize({width:320,height:740});for(const id of ['attention','loss','optimization']){await chapter(page,id);await noOverflow(page);}
  expect(errors).toEqual([]);expect(posts).toEqual([]);
});

test('actual diagram values: embedding invariants and fixed-score sampling, bilingual mobile',async({page},info)=>{
  const errors:string[]=[],posts:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()==='POST')posts.push(r.url());});
  await page.goto('/#/learn/embeddings');await page.locator('.lesson-real-details > summary').click();
  const token=page.locator('.embedding-comparison-token');const left=await token.locator('[data-position="1"]').evaluateAll(xs=>xs.map(x=>x.getAttribute('data-value')));const right=await token.locator('[data-position="7"]').evaluateAll(xs=>xs.map(x=>x.getAttribute('data-value')));expect(left).toEqual(right);
  const initial=await page.locator('.embedding-comparison').innerText();await page.getByLabel('Inspect saved weights at step',{exact:true}).selectOption('0');expect(await page.locator('.embedding-comparison').innerText()).not.toBe(initial);await expect(page.locator('.embedding-comparison')).toHaveAttribute('data-checkpoint-step','0');await capture(page.locator('.embedding-comparison'),info,'interactive-embeddings-desktop-en');
  await chapter(page,'generation');await page.locator('.lesson-real-details > summary').click();await page.getByLabel('Inspect saved weights at step',{exact:true}).selectOption('3');await expect(page.locator('.sampling-bars li')).toHaveCount(8);
  await page.locator('.sampling-draw > summary').click();await ribbonGeometry(page);await page.locator('.sampling-draw > summary').click();
  await page.locator('.sampling-table > summary').click();const scores=await page.locator('.sampling-table tbody td:nth-child(2)').allTextContents();await page.getByLabel('Chart top-k',{exact:true}).selectOption('1');await expect(page.locator('.sampling-bars li').first()).toContainText('100.0%');
  await page.getByRole('slider',{name:'Chart temperature',exact:true}).focus();await page.keyboard.press('Home');await expect(page.locator('.sampling-playground > .diagram-result')).toContainText('Temperature 0');await expect(page.locator('.sampling-bars li').first()).toContainText('100.0%');
  await page.getByLabel('Chart top-k',{exact:true}).selectOption('0');await page.getByRole('slider',{name:'Chart temperature',exact:true}).focus();await page.keyboard.press('End');await expect(page.locator('.sampling-playground > .diagram-result')).toContainText('candidates have positive probability');
  expect(await page.locator('.sampling-table tbody td:nth-child(2)').allTextContents()).toEqual(scores);
  await page.locator('.sampling-draw > summary').focus();await page.keyboard.press('Enter');await page.getByRole('slider',{name:'Example draw position',exact:true}).focus();await page.keyboard.press('Home');const selected=await page.locator('.sampling-draw .diagram-result').innerText();await page.keyboard.press('End');expect(await page.locator('.sampling-draw .diagram-result').innerText()).not.toBe(selected);expect(await page.locator('.sampling-table tbody td:nth-child(2)').allTextContents()).toEqual(scores);
  const marker=await page.locator('.probability-ribbon > i').boundingBox(),interval=await page.locator('.probability-ribbon > span.chosen').boundingBox();expect(marker).not.toBeNull();expect(interval).not.toBeNull();expect(marker!.x).toBeGreaterThanOrEqual(interval!.x-.6);expect(marker!.x).toBeLessThanOrEqual(interval!.x+interval!.width+.6);
  await page.locator('.sampling-table > summary').click();await capture(page.locator('.sampling-playground'),info,'interactive-sampling-desktop-en');
  await page.getByRole('button',{name:'JA',exact:true}).click();await page.setViewportSize({width:390,height:844});await page.getByRole('slider',{name:'グラフの温度',exact:true}).focus();await page.keyboard.press('Home');for(let i=0;i<8;i++)await page.keyboard.press('ArrowRight');await ribbonGeometry(page);await noOverflow(page);await capture(page.locator('.sampling-playground'),info,'interactive-sampling-mobile-ja');
  await chapter(page,'embeddings');await page.locator('.lesson-real-details > summary').click();await noOverflow(page);await capture(page.locator('.embedding-comparison'),info,'interactive-embeddings-mobile-ja');
  await page.setViewportSize({width:320,height:740});await noOverflow(page);await chapter(page,'generation');await page.locator('.lesson-real-details > summary').click();await noOverflow(page);
  expect(errors).toEqual([]);expect(posts).toEqual([]);
});
