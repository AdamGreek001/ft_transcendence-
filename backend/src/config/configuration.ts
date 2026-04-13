import { registerAs } from "@nestjs/config";

export const appConfig = registerAs("app", () => ({
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.BACKEND_PORT || "3001", 10),
  corsOrigin: process.env.CORS_ORIGIN || "https://localhost",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:8080",
}));

export const jwtConfig = registerAs("jwt", () => ({
  secret: process.env.JWT_SECRET || "fallback-dev-secret",
  expiration: process.env.JWT_EXPIRATION || "15m",
  refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || "7d",
}));

export const dbConfig = registerAs("database", () => ({
  url: process.env.DATABASE_URL,
}));

export const uploadConfig = registerAs("upload", () => ({
  dir: process.env.UPLOAD_DIR || "/app/uploads",
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || "10485760", 10),
}));

export const googleConfig = registerAs("google", () => ({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackUrl: process.env.GOOGLE_CALLBACK_URL,
}));

export const vaultConfig = registerAs("vault", () => ({
  addr: process.env.VAULT_ADDR || "http://vault:8200",
  token: process.env.VAULT_TOKEN,
}));
