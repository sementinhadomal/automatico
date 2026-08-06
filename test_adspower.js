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
    password: 'KxjbNhyGPj',
    protocol: 'http'
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
  name: 'AdsPower Proxy Engine',
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

const isSocks = acc.proxy.port === 49156 || (acc.proxy.protocol && acc.proxy.protocol.toLowerCase() === 'socks5');
const scheme = isSocks ? 'socks5' : 'http';

const backgroundCode = `
chrome.webRequest.onAuthRequired.addListener(
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
);

var config = {
  mode: "fixed_servers",
  rules: {
    singleProxy: {
      scheme: "${scheme}",
      host: "${acc.proxy.ip}",
      port: ${acc.proxy.port}
    },
    bypassList: ["<-loopback>"]
  }
};

chrome.proxy.settings.set({ value: config, scope: "regular" }, function() {
  console.log("AdsPower Proxy Engine Loaded Successfully");
});
`;

fs.writeFileSync(path.join(extDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
fs.writeFileSync(path.join(extDir, 'background.js'), backgroundCode);

console.log('Successfully generated AdsPower-style extension in', extDir);
