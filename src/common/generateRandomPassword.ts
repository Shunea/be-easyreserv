function generateRandomPassword(): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const specialChars = '@$!%*?&#';
  const allChars = uppercase + lowercase + digits + specialChars;

  const randomUppercase =
    uppercase[Math.floor(Math.random() * uppercase.length)];
  const randomLowercase =
    lowercase[Math.floor(Math.random() * lowercase.length)];
  const randomDigit = digits[Math.floor(Math.random() * digits.length)];
  const randomSpecialChar =
    specialChars[Math.floor(Math.random() * specialChars.length)];

  let remainingChars = '';
  for (let i = 0; i < 4; i++) {
    remainingChars += allChars[Math.floor(Math.random() * allChars.length)];
  }

  const result =
    randomUppercase +
    randomLowercase +
    randomDigit +
    randomSpecialChar +
    remainingChars;

  return result
    .split('')
    .sort(() => 0.5 - Math.random())
    .join('');
}

export default generateRandomPassword;
