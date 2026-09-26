// Verification test script for CreatorCalendar AI Authentication & Google OAuth
const BASE_URL = 'http://localhost:5000/api';

async function testAuth() {
  console.log('--- Starting Authentication & Google OAuth Verification Tests ---');
  let passed = 0;
  let total = 0;

  function assert(condition, name, details = '') {
    total++;
    if (condition) {
      console.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name}`, details);
    }
  }

  // 1. Test Google OAuth Init without credentials configured
  try {
    const res = await fetch(`${BASE_URL}/auth/google`, { redirect: 'manual' });
    const location = res.headers.get('location') || '';
    assert(
      res.status === 302 && location.includes('error=google_not_configured'),
      'Google OAuth gracefully redirects with friendly error when unconfigured',
      `Status: ${res.status}, Location: ${location}`
    );
  } catch (err) {
    assert(false, 'Google OAuth init test', err.message);
  }

  // 2. Test Registration with mismatched passwords
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Mismatch User',
        email: 'mismatch@example.com',
        password: 'password123',
        confirmPassword: 'differentpassword'
      })
    });
    assert(res.status === 400, 'Password mismatch rejection (HTTP 400)', `Status: ${res.status}`);
  } catch (err) {
    assert(false, 'Password mismatch test', err.message);
  }

  // 3. Test Successful Registration
  const testEmail = `testcreator_${Date.now()}@example.com`;
  let authToken = null;
  let authCookie = null;

  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Creator',
        email: testEmail,
        password: 'securePassword123',
        confirmPassword: 'securePassword123'
      })
    });
    const setCookie = res.headers.get('set-cookie');
    const data = await res.json();

    assert(res.status === 201 && data.token && data.user?.email === testEmail, 'User registration succeeds', JSON.stringify(data));
    assert(setCookie && setCookie.includes('token='), 'HttpOnly token cookie is returned on registration', setCookie);

    authToken = data.token;
    authCookie = setCookie;
  } catch (err) {
    assert(false, 'Registration test', err.message);
  }

  // 4. Test Session Restoration via Bearer Token
  try {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    const data = await res.json();
    assert(res.status === 200 && data.user?.email === testEmail, 'Session restoration via Bearer token works', JSON.stringify(data));
  } catch (err) {
    assert(false, 'Bearer token auth/me test', err.message);
  }

  // 5. Test Session Restoration via Cookie
  try {
    const cookieHeader = authCookie.split(';')[0];
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: {
        'Cookie': cookieHeader
      }
    });
    const data = await res.json();
    assert(res.status === 200 && data.user?.email === testEmail, 'Session restoration via HttpOnly cookie works', JSON.stringify(data));
  } catch (err) {
    assert(false, 'Cookie auth/me test', err.message);
  }

  // 6. Test Login with Valid Credentials
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'securePassword123'
      })
    });
    const setCookie = res.headers.get('set-cookie');
    const data = await res.json();

    assert(res.status === 200 && data.token && data.user?.email === testEmail, 'Login with correct credentials succeeds', JSON.stringify(data));
    assert(setCookie && setCookie.includes('token='), 'HttpOnly token cookie is returned on login', setCookie);
  } catch (err) {
    assert(false, 'Login test', err.message);
  }

  // 7. Test Login with Invalid Password
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'wrongPassword'
      })
    });
    assert(res.status === 401, 'Login with wrong password rejected with 401', `Status: ${res.status}`);
  } catch (err) {
    assert(false, 'Invalid password test', err.message);
  }

  // 8. Test Logout Cookie Clearing
  try {
    const res = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST'
    });
    const setCookie = res.headers.get('set-cookie') || '';
    assert(res.status === 200 && setCookie.includes('token=;'), 'Logout clears HttpOnly cookie', setCookie);
  } catch (err) {
    assert(false, 'Logout test', err.message);
  }

  // 9. Test Unauthorized Access without Token
  try {
    const res = await fetch(`${BASE_URL}/auth/me`);
    assert(res.status === 401, 'Protected endpoint /api/auth/me rejects unauthenticated request with 401', `Status: ${res.status}`);
  } catch (err) {
    assert(false, 'Unauthorized test', err.message);
  }

  console.log(`\n========================================`);
  console.log(`Auth Test Results: ${passed} / ${total} tests passed!`);
  console.log(`========================================`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

testAuth();
