import {expect,test} from '@playwright/test';
import {chapterIds} from '../src/lib/routes';
import {checks} from '../src/lib/checkContent';

test('each chosen idea explains its consequence and points to the right diagram in both languages',async({page},info)=>{
  const errors:string[]=[],posts:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()==='POST')posts.push(r.url());});
  await page.goto('/#/learn/overview');
  for(const [language,index] of [['en',0],['ja',1]] as const){
    if(language==='ja'){await page.getByRole('button',{name:'JA',exact:true}).click();await page.setViewportSize({width:390,height:844});}
    for(const chapter of chapterIds){
      await page.locator(`.learning-toc a[href="#/learn/${chapter}"]`).click();
      await expect(page.locator('.check-purpose')).toBeVisible();let previous='';
      for(const [optionIndex,option] of checks[chapter].options.entries()){
        const button=page.locator('.check-choices button').nth(optionIndex);await button.focus();await page.keyboard.press(optionIndex?'Space':'Enter');
        await expect(button).toHaveAttribute('aria-pressed','true');await expect(page.locator('.check-feedback h4')).toHaveText(option.heading[index]);await expect(page.locator('.check-reason')).toHaveText(option.reason[index]);await expect(page.locator('.check-cue-copy p')).toHaveText(option.cue[index]);await expect(page.locator('.check-selected')).toContainText(option.label[index]);
        const reason=await page.locator('.check-reason').innerText();expect(reason).not.toBe(previous);previous=reason;
        if(chapter==='loss'||chapter==='optimization'){
          const path=info.outputPath(`feedback-${chapter}-${optionIndex}-${language}.png`);await page.locator('.quick-check').screenshot({path});await info.attach(`feedback-${chapter}-${optionIndex}-${language}`,{path,contentType:'image/png'});
        }
        await page.locator('.check-evidence-action button').focus();await page.keyboard.press('Enter');const target=page.locator(`#${checks[chapter].targetId}`);await expect(target).toBeFocused();await expect(target).toHaveAttribute('data-check-cue',chapter);await expect(page).toHaveURL(new RegExp(`#/learn/${chapter}$`));const box=await target.boundingBox();expect(box).not.toBeNull();expect(box!.y).toBeGreaterThanOrEqual(-1);expect(box!.y+box!.height).toBeLessThanOrEqual(page.viewportSize()!.height+1);
        expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
      }
    }
  }
  // The cue points to the current dynamic answer without resetting the learner's controls.
  await page.locator('.learning-toc a[href="#/learn/attention"]').click();await page.locator('#context-boundary').focus();await page.keyboard.press('End');const boundary=await page.locator('#context-boundary').inputValue();const target=await page.locator('.context-target').innerText();await page.locator('.check-choices button').last().click();await page.locator('.check-evidence-action button').click();await expect(page.locator('#context-boundary')).toHaveValue(boundary);await expect(page.locator('.context-target')).toHaveText(target,{useInnerText:true});await expect(page.locator('.context-target')).toBeFocused();
  const cue=info.outputPath('feedback-attention-cue-mobile-ja.png');await page.locator('.beginner-diagram').screenshot({path:cue});await info.attach('feedback-attention-cue-mobile-ja',{path:cue,contentType:'image/png'});
  await page.setViewportSize({width:320,height:740});await page.locator('.check-choices button').first().click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  expect(errors).toEqual([]);expect(posts).toEqual([]);
});
