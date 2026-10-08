import { REDACTED } from './placeholders';
import { isSensitiveKey } from './sensitiveKeys';

/**
 * These are Stripe secret (`sk_`), restricted (`rk_`) and webhook-signing
 * (`whsec_`) keys, such as `sk_live_51H…` or `whsec_abc…`.
 */
const STRIPE_SECRET_KEY = /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]+|\bwhsec_[A-Za-z0-9]+/g;

/**
 * This matches a run of characters that could be part of an email address,
 * in any alphabet (`\p{L}` is any letter, `\p{N}` any digit). Emails are found
 * in two steps: this regex picks out candidate runs, and `maskEmailsIn` checks
 * each one. A single "whole email" regex would be shorter, but the usual ones
 * slow down catastrophically on crafted input such as `a@a.a.a.a…` (a ReDoS),
 * and log fields often carry user input. A lone character class like this one
 * can't backtrack, so it's always fast.
 */
const EMAIL_CANDIDATE = /[\p{L}\p{N}._%+@-]+/gu;

/**
 * The domain is the stretch of letters, digits, dots and hyphens right after
 * an '@'. The pattern is anchored with `^` and has one character class, so it
 * can't backtrack either.
 */
const DOMAIN_PREFIX = /^[\p{L}\p{N}.-]*/u;
const TOP_LEVEL_DOMAIN = /^\p{L}{2,}$/u;

/**
 * Returns the domain at the start of `text`, dropping a trailing "." or "-"
 * that is really punctuation, as in "write to jane@example.com."
 */
const domainAtStartOf = (text: string): string => {
  let end = (DOMAIN_PREFIX.exec(text) ?? [''])[0].length;
  while (end > 0 && (text[end - 1] === '.' || text[end - 1] === '-')) end -= 1;
  return text.slice(0, end);
};

/**
 * A domain needs a dot and a letters-only ending of two or more letters, so
 * `user@localhost` and `3@5.00` aren't treated as emails.
 */
const isEmailDomain = (domain: string): boolean => {
  const lastDot = domain.lastIndexOf('.');
  return lastDot > 0 && TOP_LEVEL_DOMAIN.test(domain.slice(lastDot + 1));
};

/**
 * Masks every local part in a candidate as `j***`, keeping the first
 * character and the domain, so "all gmail.com sends fail" stays visible but
 * the customer doesn't. The candidate is split on '@', and each piece that is
 * followed by a real domain is a local part. Working piece by piece also
 * covers malformed runs like `a@b.com@c.com` (both addresses masked) and
 * `jane@example.com_ref` (the `_ref` is left as it is).
 */
const maskEmailsIn = (candidate: string): string => {
  const pieces = candidate.split('@');
  if (pieces.length === 1) return candidate;

  return pieces
    .map((piece, i) => {
      const isLocalPart = piece !== '' && i < pieces.length - 1 && isEmailDomain(domainAtStartOf(pieces[i + 1]));
      /** `codePointAt` keeps a first letter outside the Basic Multilingual Plane in one piece. */
      return isLocalPart ? `${String.fromCodePoint(piece.codePointAt(0)!)}***` : piece;
    })
    .join('@');
};

/**
 * This matches one `name=value` pair of a query string, at the start of the
 * text (a bare `token=…&email=…`, as OTel's `url.query` attribute holds it) or
 * after `?` or `&` (a full URL such as `/reset-password?token=…`). Each class
 * stops at the next separator, so a failed attempt can't backtrack.
 */
const QUERY_PARAM = /(^|[?&])([^=&#\s]+)=([^&#\s]*)/g;

/** Decodes `%40`-style escapes and `+` spaces, leaving malformed escapes as they are. */
const decodeQueryPart = (part: string): string => {
  try {
    return decodeURIComponent(part.replace(/\+/g, ' '));
  } catch {
    return part;
  }
};

/**
 * Returns the value to write back for one query parameter: `[REDACTED]` for a
 * secret name such as the reset link's `token`, otherwise the value itself.
 */
const safeParamValue = (name: string, value: string): string => {
  if (isSensitiveKey(decodeQueryPart(name))) return REDACTED;
  return revealEncodedEmail(value);
};

/**
 * Decodes a value that hides an email behind `%40`, so the email masking that
 * runs next can see it. Other values are left encoded, exactly as they were.
 */
const revealEncodedEmail = (value: string): string => {
  const decoded = decodeQueryPart(value);
  return decoded.includes('@') ? decoded : value;
};

const maskQueryParams = (text: string): string =>
  text.replace(
    QUERY_PARAM,
    (_pair: string, separator: string, name: string, value: string) => `${separator}${name}=${safeParamValue(name, value)}`
  );

/** Masks secret query parameters, Stripe secret keys and email addresses inside a piece of text. */
export const maskText = (text: string): string => {
  let masked = text;
  /** The `includes` checks skip the regex work for the vast majority of strings. */
  if (masked.includes('=')) masked = maskQueryParams(masked);
  if (masked.includes('_')) masked = masked.replace(STRIPE_SECRET_KEY, REDACTED);
  if (masked.includes('@')) masked = masked.replace(EMAIL_CANDIDATE, maskEmailsIn);
  return masked;
};
