const BASE_URL = 'http://localhost:5000/api';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data, headers: res.headers };
}

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failCount++;
  }
}

async function runCrudVerification() {
  console.log('====================================================');
  console.log('SUPABASE POSTGRESQL CRUD & SCHEMA VERIFICATION TEST');
  console.log('====================================================\n');

  // 1. Database Health Check (Section 13)
  console.log('--- Step 1: Database Health Check ---');
  const healthRes = await request('/health/db');
  assert(healthRes.status === 200, 'GET /api/health/db returns HTTP 200');
  assert(healthRes.data.database === 'connected', 'Database reports "connected"');
  assert(!JSON.stringify(healthRes.data).includes('postgresql'), 'No credentials or URLs leaked in health check');

  // 2. Google OAuth Preserved (Section 17)
  console.log('\n--- Step 2: Google OAuth Route Check ---');
  const googleRes = await fetch('http://localhost:5000/api/auth/google', { redirect: 'manual' });
  assert(googleRes.status === 302, 'Google OAuth endpoint returns 302 redirect');
  const location = googleRes.headers.get('location') || '';
  assert(location.includes('accounts.google.com'), 'Redirects to accounts.google.com');
  assert(location.includes('251315568276-3kqk18rhan9diuuljio286jj297ea8kc'), 'Contains configured Google client ID');

  // 3. User CRUD (Section 3 & 14)
  console.log('\n--- Step 3: User CRUD in Supabase ---');
  const ts = Date.now();
  const emailA = `supabase_user_${ts}@example.com`;
  const regRes = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Supabase Tester',
      email: emailA,
      password: 'SecurePassword123!'
    })
  });
  assert(regRes.status === 201 && regRes.data.token, 'User created via /auth/register in Supabase');
  const userA = regRes.data.user;
  const tokenA = regRes.data.token;
  const authHeadersA = { Authorization: `Bearer ${tokenA}` };

  const meRes = await request('/auth/me', { headers: authHeadersA });
  assert(meRes.status === 200 && meRes.data.user.email === emailA, 'SELECT User via /auth/me returns persisted Supabase user');

  // 4. Social Account CRUD (Section 4 & 14)
  console.log('\n--- Step 4: Social Account CRUD ---');
  const connectRes = await request('/social/connect/instagram', {
    method: 'POST',
    headers: authHeadersA,
    body: JSON.stringify({
      isDemo: true,
      username: 'supabase_creator',
      displayName: 'Supabase Creator',
      profileUrl: 'https://instagram.com/supabase_creator'
    })
  });
  assert(connectRes.status === 200 && connectRes.data.account, 'Social account created in social_accounts table');
  const accountId = connectRes.data.account.id;

  const accountsRes = await request('/social/accounts', { headers: authHeadersA });
  const igAccount = accountsRes.data.platforms?.find(p => p.platform === 'instagram');
  assert(igAccount && igAccount.connected === true, 'SELECT Social Account returns connected Instagram account from Supabase');

  // 5. Social Profile CRUD
  console.log('\n--- Step 5: Social Profile CRUD ---');
  const profileRes = await request('/profiles', {
    method: 'POST',
    headers: authHeadersA,
    body: JSON.stringify({
      platform: 'Instagram',
      profile_url: 'https://instagram.com/supabase_creator',
      username: 'supabase_creator',
      niche: 'Database Engineering',
      target_audience: 'Backend Developers',
      content_goal: 'Growth & Authority',
      preferred_tone: 'Educational & Practical',
      timezone: 'Asia/Kolkata'
    })
  });
  assert(profileRes.status === 201 && profileRes.data.profile, 'Social profile created in social_profiles table');
  const profileId = profileRes.data.profile.id;

  const getProfileRes = await request(`/profiles/${profileId}`, { headers: authHeadersA });
  assert(getProfileRes.status === 200 && getProfileRes.data.profile.username === 'supabase_creator', 'SELECT Social Profile returns correct profile record');

  // 6. Profile Posts CRUD (Section 5 & 14)
  console.log('\n--- Step 6: Profile Posts CRUD (Nullable metrics) ---');
  const createPostRes = await request(`/profiles/${profileId}/posts`, {
    method: 'POST',
    headers: authHeadersA,
    body: JSON.stringify({
      content_type: 'Carousel',
      caption: 'Top 5 PostgreSQL Indexing Strategies for Supabase in 2026. B-Tree vs BRIN vs GIN vs GiST.',
      hashtags: ['#PostgreSQL', '#Supabase', '#DatabaseEngineering'],
      likes: 120,
      comments: 15,
      cta: 'Comment INDEX for cheatsheet',
      is_demo: false,
      post_date: new Date().toISOString()
    })
  });
  assert(createPostRes.status === 201 && createPostRes.data.post, 'Profile post created in profile_posts table');
  const profilePostId = createPostRes.data.post.id;

  const getPostsRes = await request(`/profiles/${profileId}/posts`, { headers: authHeadersA });
  assert(getPostsRes.data.posts?.length === 1, 'SELECT Profile Posts returns exactly 1 post');
  assert(getPostsRes.data.posts[0].id === profilePostId, 'Profile post matches inserted ID');

  // 7. Profile Analyses CRUD (Section 6 & 14)
  console.log('\n--- Step 7: Profile Analyses CRUD ---');
  const analyzeRes = await request(`/profiles/${profileId}/analyze`, {
    method: 'POST',
    headers: authHeadersA
  });
  assert(analyzeRes.ok, 'Analysis generated and saved to profile_analyses table');
  assert(analyzeRes.data.analysis?.analysis_mode, 'Analysis contains analysis_mode');

  const getAnalysisRes = await request(`/profiles/${profileId}/analysis`, { headers: authHeadersA });
  assert(getAnalysisRes.status === 200 && getAnalysisRes.data.analysis, 'SELECT Profile Analysis returns persisted JSONB from Supabase');

  // 8. Content Ideas CRUD (Section 7 & 14)
  console.log('\n--- Step 8: Content Ideas CRUD ---');
  const ideasGenRes = await request(`/profiles/${profileId}/ideas`, {
    method: 'POST',
    headers: authHeadersA,
    body: JSON.stringify({ profile_id: profileId })
  });
  assert(ideasGenRes.ok && ideasGenRes.data.ideas?.length > 0, 'Content ideas generated and stored in content_ideas table');
  const firstIdea = ideasGenRes.data.ideas[0];

  const getIdeasRes = await request(`/profiles/${profileId}/ideas`, { headers: authHeadersA });
  assert(getIdeasRes.status === 200 && getIdeasRes.data.ideas?.length > 0, 'SELECT Content Ideas returns persisted ideas from Supabase');

  // 9. Content Plans & Calendar Posts CRUD (Section 8, 9 & 14)
  console.log('\n--- Step 9: Content Plans & Posts CRUD ---');
  const planRes = await request('/content-plans/generate', {
    method: 'POST',
    headers: authHeadersA,
    body: JSON.stringify({
      profile_id: profileId,
      week_start: new Date().toISOString().split('T')[0]
    })
  });
  assert(planRes.ok && planRes.data.plan, 'Content plan created in content_plans table in Supabase');
  const planId = planRes.data.plan.id;

  const postsListRes = await request(`/posts?profile_id=${profileId}`, { headers: authHeadersA });
  assert(postsListRes.data.posts?.length >= 7, '7-Day calendar posts created in posts table in Supabase');
  const testPost = postsListRes.data.posts[0];
  assert(testPost.status === 'DRAFT', 'Initial post status is DRAFT');

  // Update Post Status (DRAFT -> READY -> SCHEDULED)
  const updatePostRes = await request(`/posts/${testPost.id}/status`, {
    method: 'PATCH',
    headers: authHeadersA,
    body: JSON.stringify({ status: 'READY' })
  });
  assert(updatePostRes.ok && updatePostRes.data.post.status === 'READY', 'Post status updated to READY in Supabase');

  const updatePostRes2 = await request(`/posts/${testPost.id}/status`, {
    method: 'PATCH',
    headers: authHeadersA,
    body: JSON.stringify({ status: 'SCHEDULED' })
  });
  assert(updatePostRes2.ok && updatePostRes2.data.post.status === 'SCHEDULED', 'Post status updated to SCHEDULED in Supabase');

  // 10. Campaigns CRUD (Section 10 & 14)
  console.log('\n--- Step 10: Campaigns CRUD ---');
  const createCampRes = await request('/campaigns', {
    method: 'POST',
    headers: authHeadersA,
    body: JSON.stringify({
      profile_id: profileId,
      name: 'Q4 Developer Education Sprint',
      objective: 'Educate developers on production Postgres tuning',
      start_date: '2026-10-01',
      end_date: '2026-10-31',
      status: 'ACTIVE'
    })
  });
  assert(createCampRes.status === 201 && createCampRes.data.campaign, 'Campaign created in campaigns table in Supabase');
  const campId = createCampRes.data.campaign.id;

  const getCampsRes = await request(`/campaigns?profile_id=${profileId}`, { headers: authHeadersA });
  assert(getCampsRes.data.campaigns?.some(c => c.id === campId), 'SELECT Campaigns returns created campaign from Supabase');

  // 11. User Isolation Check (Section 11)
  console.log('\n--- Step 11: Multi-tenant User Isolation ---');
  const userBRes = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Bob Competitor',
      email: `isolated_bob_${ts}@example.com`,
      password: 'Password123!'
    })
  });
  const tokenB = userBRes.data.token;
  const authHeadersB = { Authorization: `Bearer ${tokenB}` };

  const bPostsRes = await request(`/profiles/${profileId}/posts`, { headers: authHeadersB });
  assert(bPostsRes.status === 404, 'User B denied access to User A profile posts (404 Not Found)');

  const bAnalysisRes = await request(`/profiles/${profileId}/analysis`, { headers: authHeadersB });
  assert(bAnalysisRes.status === 404, 'User B denied access to User A analysis (404 Not Found)');

  // 12. Delete Test Record
  console.log('\n--- Step 12: Delete Operation Check ---');
  const delIdeaRes = await request(`/ideas/${firstIdea.id}`, {
    method: 'DELETE',
    headers: authHeadersA
  });
  assert(delIdeaRes.ok, 'DELETE idea succeeded');

  const afterDelRes = await request(`/profiles/${profileId}/ideas`, { headers: authHeadersA });
  assert(!afterDelRes.data.ideas?.some(i => i.id === firstIdea.id), 'Deleted idea no longer returned in SELECT');

  console.log('\n====================================================');
  console.log(`CRUD TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('====================================================');

  if (failCount > 0) {
    process.exit(1);
  }
}

runCrudVerification().catch(err => {
  console.error('Fatal CRUD test execution error:', err);
  process.exit(1);
});
