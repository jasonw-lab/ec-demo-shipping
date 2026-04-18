// Production configuration
// https://umijs.org/docs/guides/env-variables

import { defineConfig } from '@umijs/max';

const PUBLIC_PATH = '/shipping-antd/';

export default defineConfig({
  publicPath: PUBLIC_PATH,
  headScripts: [
    { src: `${PUBLIC_PATH}scripts/loading.js`, async: true },
  ],
  define: {
    'process.env.UMI_APP_API_BASE_URL': '/shipping-api',
    'process.env.PUBLIC_PATH': PUBLIC_PATH,
  },
});
