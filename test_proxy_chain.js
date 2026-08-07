const ProxyChain = require('proxy-chain');
const server = new ProxyChain.Server({
    port: 8000,
    prepareRequestFunction: ({ request, username, password, hostname, port, isHttp, connectionId }) => {
        return {
            requestAuthentication: false,
            upstreamProxyUrl: 'http://thaisrafipv:KxjbNhyGPj@82.140.183.78:49155',
        };
    },
});
server.listen(() => {
    console.log('Proxy server is listening on port ' + server.port);
});
