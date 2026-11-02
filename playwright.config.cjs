const {defineConfig,devices}=require('@playwright/test');
module.exports=defineConfig({testDir:'./tests/browser',use:{...devices['iPhone 13'],browserName:'webkit',baseURL:'http://127.0.0.1:8000'},webServer:{command:'python3 -m http.server 8000',url:'http://127.0.0.1:8000',reuseExistingServer:!process.env.CI}});
