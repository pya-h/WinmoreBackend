export default () => ({
  referral: {
    codeLength: +(process.env.REFERRAL_CODE_LENGTH ?? 8),
    containsAlpha:
      (process.env.REFERRAL_CONTAINS_ALPHA || 'false').toLowerCase() === 'true',
  },
});
