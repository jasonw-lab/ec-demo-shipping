/**
 * @name 代理的配置
 * @see 在生产环境 代理是无法生效的，所以这里没有生产环境的配置
 * -------------------------------
 * The agent cannot take effect in the production environment
 * so there is no configuration of the production environment
 * For details, please see
 * https://pro.ant.design/docs/deploy
 *
 * @doc https://umijs.org/docs/guides/proxy
 */
export default {
  dev: {
    '/api/v1/': {
      target: 'http://localhost:8080',
      changeOrigin: true,
      // Cookie を正しく転送するための設定
      cookieDomainRewrite: 'localhost',
      cookiePathRewrite: {
        '/api/v1/auth': '/api/v1/auth',
      },
    },
  },
  /**
   * @name 详细的代理配置
   * @doc https://github.com/chimurai/http-proxy-middleware
   */
  test: {
    '/api/v1/': {
      target: 'http://localhost:8080',
      changeOrigin: true,
    },
    '/api/': {
      target: 'https://proapi.azurewebsites.net',
      changeOrigin: true,
      pathRewrite: { '^': '' },
    },
  },
  pre: {
    '/api/v1/': {
      target: 'http://localhost:8080',
      changeOrigin: true,
    },
    '/api/': {
      target: 'your pre url',
      changeOrigin: true,
      pathRewrite: { '^': '' },
    },
  },
};
