const {defineConfig,devices}=require('@playwright/test');
module.exports=defineConfig({
  testDir:'./tests/browser',
  use:{baseURL:'http://127.0.0.1:8000'},
  projects:[
    {name:'chromium',use:{...devices['iPhone 13'],defaultBrowserType:'chromium',browserName:'chromium',...(process.env.LOCAL_CHROMIUM?{launchOptions:{executablePath:'/usr/bin/chromium',args:['--no-sandbox']}}:{})}},
    {name:'iphone-webkit',use:{...devices['iPhone 13'],browserName:'webkit'}}
  ],
  webServer:{command:'python3 tests/serve.py',url:'http://127.0.0.1:8000',reuseExistingServer:!process.env.CI}
});
