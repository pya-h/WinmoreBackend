export const generateRandomString = (
  length = 8,
  containsAlpha = true,
  exceptions = [],
) => {
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const characters = (containsAlpha ? alpha : '') + '01234567890123456789';

  let code;
  do {
    code = containsAlpha ? alpha[(Math.random() * alpha.length) | 0] : '';
    for (let i = code.length; i < length; i++) {
      code += characters[(Math.random() * characters.length) | 0];
    }
  } while (exceptions.includes(code));
  return code;
};

// module.exports = { generateRandomString };
