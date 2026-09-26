### ecom-micro/common helps developer to catch production level nodejs application error easy way.

`app.use(errorHandler)` function is to catch global level error. It's alternative to express error controller. You need to use it in your `app.js` or where you write your express app logic.

#### Example to use any error class

```JavaScript
import { BadRequestError } from '@ecom-micro/common';

return next(new BadRequestError('Invalid email or password'));
// OR
throw new BadRequestError('Invalid email or password');
```

##### List of method

```JavaScript
import { BadRequestError, NotFoundError, errorHandler } from '@ecom-micro/common';
```

#### Logging

```TypeScript
import { createLogger } from '@ecom-micro/common';

const logger = createLogger({ service: 'auth-service' });
logger.info('User logged in', { userId: user.id, email: user.email });
```

Each call writes one JSON line to stdout (`timestamp`, `level`, `service`, `version`, `environment`, `message`, `error`, plus your fields). In the cluster, Alloy ships these lines to Loki, where Grafana can query them (ADR 0001).

| Env var | Effect |
| --- | --- |
| `LOG_LEVEL` | Lowest level written (default `info`) |
| `LOG_FORMAT` | `json` or `pretty`; overrides the default |
| `NODE_ENV=development` | Pretty output unless `LOG_FORMAT` says otherwise |
| `SERVICE_VERSION`, `DEPLOYMENT_ENVIRONMENT` | Fill `version` / `environment` |

`winstonLogger(esNode, name, level)` still works but is deprecated. It ignores the Elasticsearch argument.

#### Redaction policy

Every log line is redacted before it's written, so a forgotten field can't leak a secret.

**Fields with secret names are logged as `[REDACTED]`**, whatever their value. This covers passwords, tokens, secrets, credentials, auth headers, cookies, sessions, signatures, API/private keys and card fields. The exact word lists live in [`src/observability/sensitiveKeys.ts`](src/observability/sensitiveKeys.ts). That file is the single source, so this README doesn't repeat them.

**Inside every string:**

- Emails become `j***@example.com`. The first character and the domain are kept, and addresses in any alphabet are covered.
- Stripe keys (`sk_live_…`, `sk_test_…`, `rk_…`, `whsec_…`) become `[REDACTED]`.

**Objects:**

- An object's `toJSON()` result is what gets redacted, because that's what JSON prints (e.g. Mongoose documents).
- Errors, Maps and Sets are logged with their contents, redacted.
- A loop (`node.self = node`) becomes `[Circular]`.
- Past 10 levels deep or 2,000 objects, the rest becomes `[Truncated]`.
- A field whose getter throws becomes `[Unreadable]`. The rest of the line is still written.

To protect a new kind of field, add a word to `sensitiveKeys.ts` and a case to `src/observability/__test__/redaction.test.ts`. The collector will add a second redaction layer (ticket 15), but don't rely on it.

**Not covered:** secrets written into the message text itself (e.g. `logger.info('pwd is ' + pwd)`). Always pass sensitive values as named fields.
