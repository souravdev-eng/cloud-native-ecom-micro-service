// Env loading/validation. In-cluster these come from the shared k8s
// ConfigMap (ecom-config) and Secret (ecom-secret); locally from order/.env.

const ORDER_DB_URL = process.env.ORDER_DB_URL;
const RABBITMQ_ENDPOINT = process.env.RABBITMQ_ENDPOINT;

if (!ORDER_DB_URL) {
  throw new Error("ORDER_DB_URL must be defined");
}

if (!RABBITMQ_ENDPOINT) {
  throw new Error("RABBITMQ_ENDPOINT must be defined");
}

export const config = {
  ORDER_DB_URL,
  RABBITMQ_ENDPOINT,
  PORT: parseInt(process.env.PORT ?? "4000", 10),
  NODE_ENV: process.env.NODE_ENV ?? "development",
};
