const http = require('http');
const net = require('net');

const [,, proxyHost, proxyPort, proxyUser, proxyPass] = process.argv;

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Local Proxy Tunnel is running');
});

server.on('connect', (req, clientSocket, head) => {
    const { port, hostname } = new URL(http://\);
    
    const proxySocket = net.connect(proxyPort, proxyHost, () => {
        const auth = Buffer.from(\:\).toString('base64');
        proxySocket.write(
            CONNECT \:\ HTTP/1.1\r\n +
            Host: \:\\r\n +
            Proxy-Authorization: Basic \\r\n +
            \r\n
        );
    });

    proxySocket.on('data', (chunk) => {
        if (head) {
            // First chunk is the HTTP/1.1 200 Connection Established response from the proxy
            const response = chunk.toString();
            if (response.includes('200 Connection Established') || response.includes('200 OK')) {
                clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
                head = null;
            } else {
                clientSocket.write(chunk);
            }
        } else {
            clientSocket.write(chunk);
        }
    });

    clientSocket.on('data', (chunk) => {
        if (!head) {
            proxySocket.write(chunk);
        }
    });

    proxySocket.on('error', (err) => clientSocket.destroy());
    clientSocket.on('error', (err) => proxySocket.destroy());
    proxySocket.on('close', () => clientSocket.destroy());
    clientSocket.on('close', () => proxySocket.destroy());
});

server.listen(0, '127.0.0.1', () => {
    console.log(server.address().port);
});
