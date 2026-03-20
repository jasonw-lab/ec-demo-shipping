// Production configuration
// https://umijs.org/docs/guides/env-variables

import { defineConfig } from '@umijs/max';

export default defineConfig({
  define: {
    'process.env.UMI_APP_API_BASE_URL': '/shipping-api',
  },
});
