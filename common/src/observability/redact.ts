import { isSensitiveKey } from './sensitiveKeys';
import { maskText } from './maskText';
import { CIRCULAR, REDACTED, TRUNCATED, UNREADABLE } from './placeholders';

/**
 * Anything nested deeper than this is logged as `[Truncated]`. Real log
 * payloads are a few levels deep, and the limit stops a pathological object
 * from overflowing the call stack in the middle of a log call.
 */
const MAX_DEPTH = 10;

/**
 * This caps how many objects one log call may walk. Depth alone isn't enough:
 * an object shared ten times on each of ten levels has 10^10 paths, all of
 * them shallow. A normal payload uses a few dozen objects.
 */
const MAX_OBJECTS = 2_000;

/** This is the state one `redact` call carries through the walk. */
interface Walk {
  /**
   * These are the objects between the top and the current one. Meeting one
   * again means a loop, logged as `[Circular]`. Objects leave the set on the
   * way back up, so an object that merely appears twice is logged both times.
   */
  ancestors: WeakSet<object>;
  objectsLeft: number;
}

/**
 * Returns a copy of `value` that is safe to log: fields with secret names
 * (see `sensitiveKeys.ts`) become `[REDACTED]`, and every string has its
 * emails and Stripe keys masked (see `maskText.ts`). It copies rather than
 * changes `value`, because the object belongs to the caller.
 */
export const redact = (value: unknown): unknown =>
  copySafely(value, 0, { ancestors: new WeakSet(), objectsLeft: MAX_OBJECTS });

const copySafely = (value: unknown, depth: number, walk: Walk): unknown => {
  if (typeof value === 'string') return maskText(value);
  if (value === null || typeof value !== 'object') return value;

  /**
   * Dates, Buffers and typed arrays hold no text to mask and serialise
   * sensibly on their own. Walking a large typed array field by field would be slow.
   */
  if (value instanceof Date || ArrayBuffer.isView(value)) return value;

  if (walk.ancestors.has(value)) return CIRCULAR;
  if (depth >= MAX_DEPTH || walk.objectsLeft <= 0) return TRUNCATED;
  walk.objectsLeft -= 1;

  walk.ancestors.add(value);
  const copy = copyByKind(value, depth, walk);
  walk.ancestors.delete(value);
  return copy;
};

/**
 * Turns each kind of object into the plain data JSON would print, then
 * redacts that data. Anything not handled here is treated as a plain object.
 */
const copyByKind = (value: object, depth: number, walk: Walk): unknown => {
  /**
   * `JSON.stringify` prints whatever `toJSON` returns instead of the object's
   * own fields (Mongoose documents work this way). So that result is what
   * needs redacting; copying the fields would let `toJSON` print the originals.
   */
  const toJSON = (value as { toJSON?: unknown }).toJSON;
  if (typeof toJSON === 'function') {
    let json: unknown;
    try {
      json = toJSON.call(value);
    } catch {
      return UNREADABLE;
    }
    /** Some classes' `toJSON` returns the object itself, which means "print my fields". */
    if (json !== value) return copySafely(json, depth + 1, walk);
  }

  if (Array.isArray(value)) return value.map((item) => copySafely(item, depth + 1, walk));
  if (value instanceof Set) return copySafely(Array.from(value), depth + 1, walk);
  if (value instanceof Map) {
    return copyFields(Object.fromEntries(Array.from(value, ([key, item]) => [String(key), item])), depth, walk);
  }
  /** An Error's name, message and stack aren't enumerable, so they're copied out by hand. */
  if (value instanceof Error) {
    return copyFields({ ...value, name: value.name, message: value.message, stack: value.stack }, depth, walk);
  }
  if (value instanceof RegExp) return String(value);

  return copyFields(value as Record<string, unknown>, depth, walk);
};

const copyFields = (object: Record<string, unknown>, depth: number, walk: Walk): Record<string, unknown> => {
  const copy: Record<string, unknown> = {};
  for (const key of Object.keys(object)) {
    if (isSensitiveKey(key)) {
      copy[key] = REDACTED;
      continue;
    }
    /** Reading a field runs its getter, which can throw; one bad field mustn't lose the whole log line. */
    try {
      const child = object[key];
      /**
       * JSON leaves functions out anyway. Copying one could smuggle a
       * `toJSON` past redaction, since JSON.stringify would call it later.
       */
      if (typeof child !== 'function') copy[key] = copySafely(child, depth + 1, walk);
    } catch {
      copy[key] = UNREADABLE;
    }
  }
  return copy;
};
