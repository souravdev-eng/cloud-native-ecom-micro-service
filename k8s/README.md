# Kubernetes Configuration

## Secret Files Setup

The `secret/` folder is gitignored for security reasons. You need to create the following secret files manually before deploying to Kubernetes.

### Required Secret Files

Create the following files inside the `k8s/secret/` directory:

---

### 1. `auth-secret.yml`

Used by: **Auth Service**

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: auth-credential
type: Opaque
stringData:
  AUTH_SERVICE_MONGODB_URL: 'mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>'
  MONGO_USER: '<your-mongo-username>'
  MONGO_PASSWORD: '<your-mongo-password>'
```

---

### 2. `postgres-secret.yml`

Used by: **PostgreSQL**, **Cart Service**

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: postgres-secret
type: Opaque
stringData:
  POSTGRES_PASSWORD: '<your-postgres-password>'
  CART_DB_URL: 'postgresql://cartuser:<your-postgres-password>@postgres-srv:5432/cartdb'
```

---

### 3. `secret-credential.yml`

Used by: **Auth**, **Cart**, **Order**, **Notification** services

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: secret-credential
type: Opaque
stringData:
  EMAIL_USER: '<your-email@gmail.com>'
  EMAIL_APP_PASSWORD: '<your-gmail-app-password>'
```

> **Note:** For Gmail, you need to generate an [App Password](https://support.google.com/accounts/answer/185833) instead of using your regular password.

---

### 4. `cart-secret.yml` (Optional)

If you need additional cart-specific secrets:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: cart-secret
type: Opaque
stringData:
  # Add any cart-specific secrets here
```

---

## Applying Secrets

After creating the secret files, apply them to your Kubernetes cluster:

```bash
kubectl apply -f k8s/secret/
```

Or apply individually:

```bash
kubectl apply -f k8s/secret/auth-secret.yml
kubectl apply -f k8s/secret/postgres-secret.yml
kubectl apply -f k8s/secret/secret-credential.yml
```

## Verifying Secrets

Check if secrets are created:

```bash
kubectl get secrets
```

View secret details (base64 encoded):

```bash
kubectl describe secret auth-credential
kubectl describe secret postgres-secret
kubectl describe secret secret-credential
```
