import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {describe,it,expect} from 'vitest';
const read=(path:string)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
describe('shipped third-party notices',()=>{
 for(const name of ['react','react-dom','scheduler'])it(`preserves exact ${name} version and license`,()=>{
  const meta=JSON.parse(read(`node_modules/${name}/package.json`));const lock=JSON.parse(read('package-lock.json'));const notices=read('public/THIRD_PARTY_NOTICES.txt');
  expect(meta.version).toBe(lock.packages[`node_modules/${name}`].version);expect(notices).toContain(`===== ${name} ${meta.version} =====`);expect(notices).toContain(read(`node_modules/${name}/LICENSE`));
 });
 it('ships the original-project MIT text unchanged',()=>{expect(read('public/LICENSE.txt')).toBe(read('LICENSE'));expect(read('LICENSE')).toContain('Copyright (c) 2026 domizo');expect(JSON.parse(read('package.json')).license).toBe('MIT');expect(JSON.parse(read('package-lock.json')).packages[''].license).toBe('MIT');expect(JSON.parse(read('public/runs/demo.json')).dataset.license).toBe('MIT; original project-authored demo text (see LICENSE)');});
 it('passes the same exact-notice gate as the production build',()=>{expect(()=>execFileSync(process.execPath,['scripts/generate_notices.mjs','--check'])).not.toThrow();});
});
