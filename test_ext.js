const fs = require('fs');
const path = require('path');

const acc = {
  id: 'acc_hot_pt_01',
  name: 'HOT Portugal 01',
  country: 'Portugal',
  languageCode: 'pt-pt',
  proxy: {
    ip: '82.140.183.78',
    port: 49155,
    username: 'thaisrafipv',
    password: 'KxjbNhyGPj'
  }
};

const profileDir = `C:\\OmniMedia\\Profiles\\${acc.id}`;
const extDir = path.join(profileDir, 'proxy_ext');

if (!fs.existsSync(extDir)) {
  fs.mkdirSync(extDir, { recursive: true });
}

const manifest = {
  version: '1.0.0',
  manifest_version: 2,
  name: 'OmniMedia Auto Proxy Auth',
  permissions: [
    'proxy',
    'tabs',
    'unlimitedStorage',
    'storage',
    '<all_urls>',
    'webRequest',
    'webRequestBlocking'
  ],
  background: {
    scripts: ['background.js']
  }
};

const backgroundCode = `chrome.webRequest.onAuthRequired.addListener(
  function(details) {
    return {
      authCredentials: {
        username: "${acc.proxy.username}",
        password: "${acc.proxy.password}"
      }
    };
  },
  { urls: ["<all_urls>"] },
  ["blocking"]
);`;

fs.writeFileSync(path.join(extDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
fs.writeFileSync(path.join(extDir, 'background.js'), backgroundCode);

console.log('Successfully created Chrome extension in', extDir);
