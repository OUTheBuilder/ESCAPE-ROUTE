import assert from 'node:assert/strict';

const base = process.env.AUTH_TEST_URL || 'http://127.0.0.1:8080';
const suffix = Date.now().toString();
const email = `test-${suffix}@example.com`;
const username = `tester${suffix}`;
const password = 'correct-horse-battery';
const pin = '482615';

async function request(path, body, token) {
  return fetch(base + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

const healthResponse = await request('/health');
assert.equal(healthResponse.status, 200);
const health = await healthResponse.json();
assert.equal(health.configured, true);

const badPassword = await request('/v1/auth/register', { email, username, password: 'short' });
assert.equal(badPassword.status, 400, 'reject short passwords');

const register = await request('/v1/auth/register', { email, username, password });
assert.equal(register.status, 201, 'register account');
const created = await register.json();
assert.ok(created.token);
assert.equal(created.user.username, username);

const duplicate = await request('/v1/auth/register', { email, username: username + 'x', password });
assert.equal(duplicate.status, 409, 'reject duplicate email');

for (const identifier of [email, username]) {
  const login = await request('/v1/auth/login', { identifier, password });
  assert.equal(login.status, 200, `password login works for ${identifier === email ? 'email' : 'username'}`);
  assert.ok((await login.json()).token);
}
const wrongPassword = await request('/v1/auth/login', { identifier: username, password: 'wrong-password' });
assert.equal(wrongPassword.status, 401, 'reject incorrect password');

const savePin = await request('/v1/auth/pin', { pin }, created.token);
assert.equal(savePin.status, 200, 'save PIN for authenticated user');

for (const identifier of [email, username]) {
  const login = await request('/v1/auth/login-pin', { identifier, pin });
  assert.equal(login.status, 200, `PIN login works for ${identifier === email ? 'email' : 'username'}`);
  assert.ok((await login.json()).token);
}
const wrongPin = await request('/v1/auth/login-pin', { identifier: username, pin: '000000' });
assert.equal(wrongPin.status, 401, 'reject incorrect PIN');

const me = await request('/v1/auth/me', undefined, created.token);
assert.equal(me.status, 200, 'verify authenticated session');
assert.equal((await me.json()).user.username, username);

console.log('Integration checks passed: registration, duplicate rejection, email/username password login, PIN setup/login, invalid credentials, and authenticated profile.');
