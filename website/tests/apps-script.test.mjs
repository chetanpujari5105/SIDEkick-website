// Runs integrations/google-sheets/Code.gs in a Node VM against an in-memory stand-in for the
// Apps Script services it uses. Proves the receiver's logic; it cannot prove Google's runtime.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeEnv } from './apps-script-env.mjs';

const valid = {
  name: 'Maya Chen',
  email: 'Maya.Chen@Example.com',
  mac: 'apple-silicon',
  phone_model: 'Pixel 8',
  android_version: '15',
  country: 'India',
  wish: 'Reply to messages from my Mac',
  consent: 'yes',
  _js: '1',
};
const post = (env, parameter) => env.ctx.doPost({ parameter });
const body = (out) => JSON.parse(out.content);

test('a valid request becomes one row with the expected columns', () => {
  const env = makeEnv();
  assert.deepEqual(body(post(env, valid)), { ok: true });
  const [header, row] = env.rows();
  assert.equal(header[2], 'Google account email');
  assert.equal(Object.prototype.toString.call(row[0]), '[object Date]');
  assert.deepEqual(row.slice(1), [
    'Maya Chen', 'maya.chen@example.com', 'Apple silicon', 'Pixel 8', 'Android 15', 'India',
    'Reply to messages from my Mac', 'Yes', 'New', '', '', '',
  ]);
});

test('the same email (any case) is stored once', () => {
  const env = makeEnv();
  post(env, valid);
  assert.deepEqual(body(post(env, { ...valid, email: 'MAYA.CHEN@example.com', name: 'Maya again' })), { ok: true });
  assert.equal(env.rows().length, 2);
});

test('honeypot submissions report success but store nothing', () => {
  const env = makeEnv();
  assert.deepEqual(body(post(env, { ...valid, website: 'http://spam.example' })), { ok: true });
  assert.equal(env.rows().length, 0);
});

test('values that look like formulas are stored as text', () => {
  const env = makeEnv();
  post(env, { ...valid, name: '=HYPERLINK("http://x","y")', phone_model: '+1 phone', wish: '@everyone' });
  const row = env.rows()[1];
  assert.equal(row[1], '\'=HYPERLINK("http://x","y")');
  assert.equal(row[4], "'+1 phone");
  assert.equal(row[7], "'@everyone");
});

test('invalid requests are refused with the failing fields and nothing is stored', () => {
  const env = makeEnv();
  const res = body(post(env, { ...valid, name: '', email: 'maya@', mac: 'windows', android_version: '9', consent: '', wish: 'x'.repeat(1001) }));
  assert.equal(res.ok, false);
  assert.deepEqual([...res.fields].sort(), ['android_version', 'consent', 'email', 'mac', 'name', 'wish']);
  assert.equal(env.rows().length, 0);
});

test('a phone model or name past the limit is refused', () => {
  const env = makeEnv();
  assert.equal(body(post(env, { ...valid, phone_model: 'x'.repeat(121) })).ok, false);
  assert.equal(body(post(env, { ...valid, name: 'x'.repeat(101) })).ok, false);
});

test('without _js the reply is a readable page, not JSON', () => {
  const env = makeEnv();
  const { _js, ...noJs } = valid;
  const out = post(env, noJs);
  assert.match(out.content, /Request received/);
  assert.match(out.content, /href="https:\/\/example.test\/beta" target="_top"/);
  assert.match(post(env, { ...noJs, consent: '' }).content, /didn’t go through/);
});

test('a storage failure is reported as a failure', () => {
  const env = makeEnv({ failOnAppend: true });
  assert.deepEqual(body(post(env, valid)), { ok: false, error: 'server' });
});

test('export lists only "Selected" emails, and marking sets Invited + date', () => {
  const env = makeEnv();
  post(env, valid);
  post(env, { ...valid, email: 'sam@example.com' });
  post(env, { ...valid, email: 'alex@example.com' });
  const rows = env.rows();
  rows[1][9] = 'Selected';
  rows[3][9] = 'Selected';
  env.ctx.exportSelectedForPlay();
  assert.deepEqual(env.sheets.get('Play testers export').rows, [['maya.chen@example.com'], ['alex@example.com']]);
  assert.match(env.dialogs.at(-1), /maya\.chen@example\.com, alex@example\.com/);
  env.ctx.markSelectedAsInvited();
  assert.equal(rows[1][9], 'Invited');
  assert.equal(rows[2][9], 'New');
  assert.equal(Object.prototype.toString.call(rows[3][10]), '[object Date]');
});
