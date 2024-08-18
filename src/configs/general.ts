export default () => ({
  general: {
    debug: (process.env.DEBUG || 'false').toLowerCase() === 'true',
    appPort: +(process.env.APP_PORT || 8000),
    appName: process.env.APP_NAME || 'Unnamed',
  },
});
