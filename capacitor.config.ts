import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bodhiberry.pos',
  appName: 'bodhiberry',
  webDir: 'public',
  server: {
    url: 'https://cafe.bodhiberry.com/',
    cleartext: true
  }
};

export default config;
