import dotenv from "dotenv";

const envConfig: dotenv.DotenvParseOutput | undefined = dotenv.config({
  path: "d:/.env",
  quiet: true,
}).parsed;

console.log(`✅MYSQL_HOST: ${envConfig?.MYSQL_HOST}`);
console.log(`📋 All .env variables:`, envConfig);

if (envConfig) {
  for (const [key, value] of Object.entries(envConfig)) {
    console.log(`✅${key}: ${value}`);
  }
}
