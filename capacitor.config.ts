import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bodhiberry.pos',
  appName: 'XolaCloud',
  webDir: 'public',
  server: {
    url: 'https://cafe.xolacloud.com/',
    cleartext: true
  }
};

export default config;
