export const envValidate = (config: Record<string, unknown>) => {
  const required = [
    "POSTGRES_HOST",
    "POSTGRES_PORT",
    "POSTGRES_USER",
    "POSTGRES_PASSWORD",
    "POSTGRES_DB",
    "JWT_SECRET",
    "BCRYPT_ROUNDS",
    "BCRYPT_PEPPER",
    "REDIS_HOST",
    "REDIS_PORT",
  ];

  for (const key of required) {
    if (!config[key]) {
      throw new Error(`Missing environment variable: ${key}`);
    }
  }

  return {
    ...config,
    POSTGRES_PORT: Number(config.POSTGRES_PORT),
    BCRYPT_ROUNDS: Number(config.BCRYPT_ROUNDS),
    REDIS_PORT: Number(config.REDIS_PORT),
  };
};
