const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    createProxyMiddleware('/api', {
      target: '"proxy": "https://solved.ac/api/v3"',
      changeOrigin: true,
    }),
  );
};