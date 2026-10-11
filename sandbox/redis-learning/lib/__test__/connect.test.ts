import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertSandboxUrl, connect } from '../connect';

/**
 * The guard is the only thing standing between a lab and a Redis someone
 * cares about, so every way of pointing it somewhere else must throw.
 */
test('refuses the cluster product-redis service', () => {
  assert.throws(() => assertSandboxUrl('redis://product-redis-service:6379'), /not a sandbox Redis/);
});

test('refuses localhost on the default port, where a port-forward to the cluster lives', () => {
  assert.throws(() => assertSandboxUrl('redis://localhost:6379'), /not a sandbox Redis/);
  assert.throws(() => assertSandboxUrl('redis://localhost'), /not a sandbox Redis/);
});

test('refuses localhost outside the sandbox port range', () => {
  assert.throws(() => assertSandboxUrl('redis://127.0.0.1:6389'), /not a sandbox Redis/);
  assert.throws(() => assertSandboxUrl('redis://127.0.0.1:6400'), /not a sandbox Redis/);
});

test('refuses remote hosts even on a sandbox port', () => {
  assert.throws(() => assertSandboxUrl('redis://10.0.0.5:6390'), /not a sandbox Redis/);
  assert.throws(() => assertSandboxUrl('redis://my-redis.cache.amazonaws.com:6390'), /not a sandbox Redis/);
});

test('refuses non-redis schemes and unparseable URLs', () => {
  assert.throws(() => assertSandboxUrl('rediss://localhost:6390'), /not a sandbox Redis/);
  assert.throws(() => assertSandboxUrl('not a url'), /not a sandbox Redis/);
});

test('accepts localhost on a sandbox port', () => {
  assert.doesNotThrow(() => assertSandboxUrl('redis://localhost:6390'));
  assert.doesNotThrow(() => assertSandboxUrl('redis://127.0.0.1:6399'));
  assert.doesNotThrow(() => assertSandboxUrl('redis://[::1]:6391'));
});

test('accepts a compose service hostname inside the lab network', () => {
  assert.doesNotThrow(() => assertSandboxUrl('redis://lab-redis:6379'));
});

/** The check must run before any socket is opened, so this rejects without a Redis to talk to. */
test('connect() rejects a non-sandbox URL before connecting', async () => {
  await assert.rejects(connect('redis://localhost:6379'), /not a sandbox Redis/);
  await assert.rejects(connect('redis://product-redis-service:6379'), /not a sandbox Redis/);
});
