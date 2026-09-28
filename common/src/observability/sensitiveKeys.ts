/**
 * This file decides which field names are secret. A field whose name matches
 * is logged as `[REDACTED]`, whatever its value. To protect a new kind of
 * field, add a word to one of the three lists below and a case to
 * `__test__/redaction.test.ts`.
 *
 * Names are compared lowercased with everything except letters and digits
 * removed, so write the words that way: `STRIPE_SECRET_KEY` is compared as
 * `stripesecretkey`, `x-api-key` as `xapikey` and `card.number` as `cardnumber`.
 */

/**
 * A name containing any of these anywhere is secret, e.g. `newPassword`,
 * `clientSecret`, `set-cookie`, `sessionId` or `Stripe-Signature`.
 */
const SECRET_IF_CONTAINS = [
  'password',
  'passwd',
  'passcode',
  'secret',
  'credential',
  'authorization',
  'bearer',
  'cookie',
  'session',
  'signature',
  'jwt',
  'apikey',
  'privatekey',
];

/**
 * A name ending with any of these is secret, e.g. `accessToken`,
 * `refresh_token` or `connect.sid`. They aren't in the list above because
 * names like `tokenizer` or `considerate` aren't secrets.
 */
const SECRET_IF_ENDS_WITH = ['token', 'tokens', 'pwd', 'sid'];

/**
 * Only these exact names are secret. Card fields live here because "card" is
 * part of ordinary words like `discard` and `cardinality`. Masking `card`
 * hides the whole object, including its number and expiry.
 */
const SECRET_IF_EXACTLY = ['card', 'cardnumber', 'cvc', 'cvc2', 'cvv', 'cvv2', 'pan', 'otp'];

export const isSensitiveKey = (key: string): boolean => {
  const name = key.toLowerCase().replace(/[^a-z0-9]/g, '');

  return (
    SECRET_IF_EXACTLY.includes(name) ||
    SECRET_IF_CONTAINS.some((word) => name.includes(word)) ||
    SECRET_IF_ENDS_WITH.some((word) => name.endsWith(word))
  );
};
