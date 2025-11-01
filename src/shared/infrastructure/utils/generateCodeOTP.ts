export const generateCodeOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const TIME_EXPIRATION_MINUTES: Date = new Date(
  Date.now() + 15 * 60 * 1000
);
