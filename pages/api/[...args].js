import { createProxyMiddleware } from 'http-proxy-middleware';

export default createProxyMiddleware({
      target: 'https://solved.ac/api/v3',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '',
      },prependPath: true,
    });