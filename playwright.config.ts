import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./e2e',fullyParallel:false,workers:1,forbidOnly:!!process.env.CI,retries:process.env.CI?1:0,timeout:120000,
 expect:{timeout:20000},reporter:[['list'],['html',{open:'never'}]],
 use:{baseURL:'http://127.0.0.1:4173',viewport:{width:1536,height:1024},trace:'retain-on-failure',screenshot:'only-on-failure'},
 webServer:[
  {command:'npm run preview -- --port 4173',url:'http://127.0.0.1:4173',reuseExistingServer:!process.env.CI},
  {command:`${process.env.FIRST_LM_PYTHON||'python'} -m model_lab serve --port 8765`,url:'http://127.0.0.1:8765/api/health',reuseExistingServer:!process.env.CI,timeout:120000},
 ],
});
