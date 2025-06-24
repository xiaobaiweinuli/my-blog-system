declare module 'https-proxy-agent' {
  import { Agent } from 'http';
  import { URL } from 'url';

  export class HttpsProxyAgent extends Agent {
    constructor(proxy: string | URL);
  }
}
