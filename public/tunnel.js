const net = require('net');

// Argumentos: node tunnel.js <localPort> <targetHost> <targetPort> <user> <pass>
const localPort = parseInt(process.argv[2] || '10800', 10);
const targetHost = process.argv[3] || 'proxy22-br-hz.ipbr.pro';
const targetPort = parseInt(process.argv[4] || '10000', 10);
const proxyUser = process.argv[5] || '';
const proxyPass = process.argv[6] || '';

const server = net.createServer((clientSocket) => {
  const targetSocket = new net.Socket();

  targetSocket.connect(targetPort, targetHost, () => {
    // SOCKS5 Greeting: 0x05 (version), 0x02 (methods count), 0x00 (no auth), 0x02 (user/pass)
    targetSocket.write(Buffer.from([0x05, 0x02, 0x00, 0x02]));
  });

  let state = 'GREETING';

  targetSocket.on('data', (data) => {
    if (state === 'GREETING') {
      const chosenMethod = data[1];
      if (chosenMethod === 0x02 && proxyUser) {
        // User/Pass Auth Method
        const userBuf = Buffer.from(proxyUser);
        const passBuf = Buffer.from(proxyPass);
        const authReq = Buffer.concat([
          Buffer.from([0x01, userBuf.length]),
          userBuf,
          Buffer.from([passBuf.length]),
          passBuf,
        ]);
        state = 'AUTH';
        targetSocket.write(authReq);
      } else if (chosenMethod === 0x00) {
        // No Auth Method
        state = 'CONNECTED';
        clientSocket.write(Buffer.from([0x05, 0x00]));
        clientSocket.pipe(targetSocket);
        targetSocket.pipe(clientSocket);
      } else {
        clientSocket.destroy();
      }
    } else if (state === 'AUTH') {
      const status = data[1];
      if (status === 0x00) {
        // Auth Successful
        state = 'CONNECTED';
        clientSocket.write(Buffer.from([0x05, 0x00]));
        clientSocket.pipe(targetSocket);
        targetSocket.pipe(clientSocket);
      } else {
        console.error('Proxy Authentication Failed!');
        clientSocket.destroy();
        targetSocket.destroy();
      }
    }
  });

  clientSocket.on('data', (data) => {
    if (state === 'GREETING' && data[0] === 0x05) {
      // Intercept client SOCKS5 handshake
    }
  });

  clientSocket.on('error', () => targetSocket.destroy());
  targetSocket.on('error', () => clientSocket.destroy());
});

server.listen(localPort, '127.0.0.1', () => {
  console.log(`[OmniMedia Tunnel] 127.0.0.1:${localPort} -> ${targetHost}:${targetPort}`);
});
