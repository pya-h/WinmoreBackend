export default () => ({
  general: {
    debug: (process.env.DEBUG || 'false').toLowerCase() === 'true',
    domain: process.env.DOMAIN,
    appPort: +process.env.APP_PORT,
    appName: process.env.APP_NAME,
    appVersion: process.env.APP_VERSION,
  },
});
