// Env loading/validation. In-cluster these come from the k8s ConfigMap
// (app-config) and Secret (order-secret); locally from order/.env.

const DB_URL = process.env.DB_URL;
const RABBITMQ_ENDPOINT = process.env.RABBITMQ_ENDPOINT;

if (!DB_URL) {
  throw new Error("DB_URL must be defined");
}

if (!RABBITMQ_ENDPOINT) {
  throw new Error("RABBITMQ_ENDPOINT must be defined");
}

export const config = {
  DB_URL,
  RABBITMQ_ENDPOINT,
  PORT: parseInt(process.env.PORT ?? "4000", 10),
  NODE_ENV: process.env.NODE_ENV ?? "development",
};
