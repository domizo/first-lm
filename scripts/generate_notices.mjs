import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const lock=JSON.parse(readFileSync(resolve(root,'package-lock.json'),'utf8'));
const names=['react','react-dom','scheduler'];
const projectLicense=readFileSync(resolve(root,'LICENSE'),'utf8');
const servedLicense=resolve(root,'public/LICENSE.txt');
let output='first-lm — bundled browser dependency notices\n\nOriginal first-lm code, original corpus and bundled weights use the MIT license in LICENSE.txt.\nThe following third-party packages are included in the browser build.\nTheir original copyright and license notices follow, without changes.\n\n';
for(const name of names){
 const meta=JSON.parse(readFileSync(resolve(root,'node_modules',name,'package.json'),'utf8'));
 const expected=lock.packages[`node_modules/${name}`];
 if(!expected||meta.version!==expected.version||meta.license!=='MIT')throw Error(`Review license/version change for ${name}`);
 const license=readFileSync(resolve(root,'node_modules',name,'LICENSE'),'utf8');
 output+=`===== ${name} ${meta.version} =====\nSource: https://www.npmjs.com/package/${name}/v/${meta.version}\n\n${license}${license.endsWith('\n')?'':'\n'}\n`;
}
const destination=resolve(root,'public/THIRD_PARTY_NOTICES.txt');
if(process.argv.includes('--check')){
 if(readFileSync(servedLicense,'utf8')!==projectLicense)throw Error('Served project LICENSE.txt differs from LICENSE. Run npm run notices and review.');
 if(readFileSync(destination,'utf8')!==output)throw Error('Bundled notices differ from the locked installed packages. Run npm run notices and review the change.');
 console.log('Bundled React, React DOM and Scheduler notices match the locked packages.');
}else{writeFileSync(servedLicense,projectLicense);writeFileSync(destination,output);console.log('Wrote public/THIRD_PARTY_NOTICES.txt');}
