export default () => ({
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiry: process.env.JWT_EXPIRY,
    nonceExpiry: +process.env.NONCE_EXPIRY,
    siweStatement: process.env.SIWE_STATEMENT,
    siweMsgVersion: process.env.SIWE_MESSAGE_VERSION,
  },
});
