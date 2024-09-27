export const generateRandomString = ({
  length = 10,
  prefix = '',
}: {
  length?: number;
  prefix?: string;
}) => {
  const sourceChars = '0123456789abcdefghijklmnopqrstudvwxyz0123456789';
  return (
    prefix +
    Array(length)
      .fill(null)
      .map(() => sourceChars[(Math.random() * sourceChars.length) | 0])
      .join('')
  );
};
