@echo off
echo const http=require('http');const net=require('net');const [,,lPort,tHost,tPort,user,pass]=process.argv;const auth=Buffer.from(user+':'+pass).toString('base64');console.log(process.pid);const server=http.createServer();server.on('connect',(req,clientSocket,head)=>{const pSocket=net.connect(Number(tPort),tHost,()=>{pSocket.write('CONNECT '+req.url+' HTTP/1.1\r\nHost: '+req.url+'\r\nProxy-Authorization: Basic '+auth+'\r\n\r\n');});let connected=false;pSocket.on('data',(chunk)=>{if(!connected){const str=chunk.toString();if(str.includes('200')){connected=true;clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');const hEnd=chunk.indexOf('\r\n\r\n');if(hEnd!==-1&&chunk.length>hEnd+4)clientSocket.write(chunk.slice(hEnd+4));}else clientSocket.write(chunk);}else clientSocket.write(chunk);});clientSocket.on('data',(chunk)=>{if(connected)pSocket.write(chunk);});pSocket.on('error',()=>clientSocket.destroy());clientSocket.on('error',()=>pSocket.destroy());});server.listen(lPort,'127.0.0.1'); > tunnel.js

node tunnel.js 41234 82.140.183.78 49155 thaisrafipv KxjbNhyGPj > pid.txt 2>&1 &
Start-Sleep -Seconds 2

curl -x http://127.0.0.1:41234 -I https://api.ipify.org
