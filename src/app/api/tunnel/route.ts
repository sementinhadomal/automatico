import { NextResponse } from 'next/server';
// @ts-ignore
import ProxyChain from 'proxy-chain';

// Mapa global para guardar os servidores ativos
const activeServers: Record<string, any> = {};

export async function POST(req: Request) {
  try {
    const { proxy, accountId } = await req.json();

    if (!proxy || !proxy.host || !proxy.port || !accountId) {
      return NextResponse.json({ success: false, error: 'Dados insuficientes.' }, { status: 400 });
    }

    const localPort = 40000 + (Math.abs(accountId.split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0)) % 10000);

    // Se já existe um servidor rodando para essa conta, desligamos antes de criar outro
    if (activeServers[accountId]) {
      try {
        await activeServers[accountId].close(true);
      } catch (e) {}
      delete activeServers[accountId];
    }

    const isSocks = proxy.protocol && proxy.protocol.toLowerCase().includes('socks');
    const proxyProtocol = isSocks ? 'socks5' : 'http';
    const authString = proxy.user && proxy.pass ? `${proxy.user}:${proxy.pass}@` : '';
    const upstreamProxyUrl = `${proxyProtocol}://${authString}${proxy.host}:${proxy.port}`;

    console.log(`Starting proxy-chain for ${accountId} on port ${localPort} -> ${upstreamProxyUrl}`);

    const server = new ProxyChain.Server({
      port: localPort,
      verbose: true,
      prepareRequestFunction: () => {
        return {
          requestAuthentication: false,
          upstreamProxyUrl: upstreamProxyUrl,
        };
      },
    });

    server.on('serverError', (err: any) => {
      console.error(`Proxy server error on port ${localPort}:`, err);
    });

    await server.listen();
    activeServers[accountId] = server;

    return NextResponse.json({ success: true, localPort });
  } catch (err: any) {
    console.error('Error starting proxy tunnel:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
