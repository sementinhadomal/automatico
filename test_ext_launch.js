const { execSync } = require('child_process');
const fs = require('fs');
const profileDir = 'C:\\OmniMedia\\Profiles\\test_ext_error';
const extDir = profileDir + '\\proxy_ext';
if (!fs.existsSync(extDir)) fs.mkdirSync(extDir, { recursive: true });

const manifest = {
  version: '1.0.0', manifest_version: 3, name: 'Proxy Test',
  permissions: ['proxy', 'webRequest', 'webRequestAuthProvider'],
  host_permissions: ['<all_urls>'],
  background: { service_worker: 'background.js' }
};
fs.writeFileSync(extDir + '\\manifest.json', JSON.stringify(manifest));

const bg = 'chrome.webRequest.onAuthRequired.addListener(function(d){return{authCredentials:{username:\"a\",password:\"b\"}};},{urls:[\"<all_urls>\"]},[\"blocking\"]);chrome.proxy.settings.set({value:{mode:\"fixed_servers\",rules:{singleProxy:{scheme:\"http\",host:\"1.2.3.4\",port:8080}}},scope:\"regular\"},function(){});';
fs.writeFileSync(extDir + '\\background.js', bg);

// Launch chrome and exit Node, leaving Chrome open
require('child_process').spawn('C:\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe', [
  '--load-extension=' + extDir,
  '--user-data-dir=' + profileDir,
  '--no-first-run',
  'chrome://extensions'
], { detached: true, stdio: 'ignore' }).unref();
