const net = require('net');

// Argumentos: node tunnel.js <localPort> <targetHost> <targetPort> <user> <pass>
const localPort = parseInt(process.argv[2] || '10800', 10);
const targetHost = process.argv[3] || 'proxy22-br-hz.ipbr.pro';
const targetPort = parseInt(process.argv[4] || '10000', 10);
const proxyUser = process.argv[5] || '';
const proxyPass = process.argv[6] || '';

const server = net.createServer((clientSocket) => {
  let clientState = 'WAIT_GREETING'; // WAIT_GREETING -> WAIT_CONNECT -> RELAY
  let upstreamState = 'INIT'; // INIT -> WAIT_GREETING_REPLY -> WAIT_AUTH_REPLY -> RELAY
  
  let targetSocket = null;
  let clientBuffer = Buffer.alloc(0);
  let upstreamBuffer = Buffer.alloc(0);

  const fail = () => {
    clientSocket.destroy();
    if (targetSocket) targetSocket.destroy();
  };

  clientSocket.on('data', (data) => {
    if (clientState === 'RELAY') {
      if (targetSocket) targetSocket.write(data);
      return;
    }
    clientBuffer = Buffer.concat([clientBuffer, data]);
    
    if (clientState === 'WAIT_GREETING') {
      if (clientBuffer.length >= 2) {
        const numMethods = clientBuffer[1];
        if (clientBuffer.length >= 2 + numMethods) {
          // Recebeu o greeting completo do Chrome
          clientBuffer = clientBuffer.slice(2 + numMethods);
          clientState = 'WAIT_CONNECT';
          
          // Agora conecta no proxy real
          targetSocket = new net.Socket();
          targetSocket.on('error', fail);
          targetSocket.on('data', onUpstreamData);
          
          targetSocket.connect(targetPort, targetHost, () => {
            upstreamState = 'WAIT_GREETING_REPLY';
            // Manda o Greeting pro proxy real: Suporta no-auth(0x00) e user/pass(0x02)
            targetSocket.write(Buffer.from([0x05, 0x02, 0x00, 0x02]));
          });
        }
      }
    } else if (clientState === 'WAIT_CONNECT') {
      // Chrome mandou dados cedo demais, fica no buffer
    }
  });

  const onUpstreamData = (data) => {
    if (upstreamState === 'RELAY') {
      clientSocket.write(data);
      return;
    }
    upstreamBuffer = Buffer.concat([upstreamBuffer, data]);
    
    if (upstreamState === 'WAIT_GREETING_REPLY') {
      if (upstreamBuffer.length >= 2) {
        const chosenMethod = upstreamBuffer[1];
        upstreamBuffer = upstreamBuffer.slice(2);
        
        if (chosenMethod === 0x02 && proxyUser) {
          upstreamState = 'WAIT_AUTH_REPLY';
          const userBuf = Buffer.from(proxyUser);
          const passBuf = Buffer.from(proxyPass);
          const authReq = Buffer.concat([
            Buffer.from([0x01, userBuf.length]),
            userBuf,
            Buffer.from([passBuf.length]),
            passBuf,
          ]);
          targetSocket.write(authReq);
        } else if (chosenMethod === 0x00) {
          upstreamReady();
        } else {
          console.error('Proxy upstream recusou metodos suportados');
          fail();
        }
      }
    }
    
    if (upstreamState === 'WAIT_AUTH_REPLY') {
      if (upstreamBuffer.length >= 2) {
        const status = upstreamBuffer[1];
        upstreamBuffer = upstreamBuffer.slice(2);
        
        if (status === 0x00) {
          upstreamReady();
        } else {
          console.error('Falha na autenticacao do proxy');
          fail();
        }
      }
    }
  };

  const upstreamReady = () => {
    upstreamState = 'RELAY';
    clientState = 'RELAY';
    // Diz pro Chrome: "Greeting aceito, sem auth (pq nos ja autenticamos upstream)"
    clientSocket.write(Buffer.from([0x05, 0x00]));
    
    // Se o Chrome ja mandou o Connect Request na fila, envia
    if (clientBuffer.length > 0) {
      targetSocket.write(clientBuffer);
      clientBuffer = Buffer.alloc(0);
    }
    
    // Se o proxy mandou algo a mais (improvavel), manda pro Chrome
    if (upstreamBuffer.length > 0) {
      clientSocket.write(upstreamBuffer);
      upstreamBuffer = Buffer.alloc(0);
    }
  };

  clientSocket.on('error', fail);
});

server.listen(localPort, '127.0.0.1', () => {
  console.log(`[OmniMedia Tunnel] 127.0.0.1:${localPort} -> ${targetHost}:${targetPort}`);
});
