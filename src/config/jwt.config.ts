export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  signOptions: {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
};