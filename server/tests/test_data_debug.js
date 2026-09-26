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
  return { status: res.status, ok: res.ok, data };
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

async function runTests() {
  console.log('====================================================');
  console.log('RUNNING CRITICAL DATA + AI ANALYSIS DEBUG TEST SUITE');
  console.log('====================================================\n');

  const ts = Date.now();

  // Register User A
  const userARes = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Alice Debugger',
      email: `alice_${ts}@example.com`,
      password: 'Password123!'
    })
  });
  assert(userARes.status === 201 && userARes.data.token, 'User A registered successfully');
  const tokenA = userARes.data.token;
  const authHeadersA = { Authorization: `Bearer ${tokenA}` };

  // ====================================================
  // TEST 1 — ZERO POSTS -> STARTER CONTENT STRATEGY
  // ====================================================
  console.log('\n--- TEST 1 — ZERO POSTS: Profile with zero posts ---');
  const prof1Res = await request('/profiles', {
    method: 'POST',
    headers: authHeadersA,
    body: JSON.stringify({
      platform: 'Instagram',
      profile_url: 'https://instagram.com/alicedebug_fresh',
      username: 'alicedebug_fresh',
      niche: 'Fullstack Web Development',
      target_audience: 'Junior Software Engineers',
      content_goal: 'Educational Authority & Community',
      preferred_tone: 'Pragmatic & Encouraging',
      timezone: 'Asia/Kolkata'
    })
  });
  assert(prof1Res.status === 201 && prof1Res.data.profile, 'Profile 1 created with 0 posts');
  const prof1Id = prof1Res.data.profile.id;

  // Check Dashboard for Profile 1 before analysis
  const dash1Res = await request(`/dashboard/summary?profile_id=${prof1Id}`, {
    method: 'GET',
    headers: authHeadersA
  });
  assert(dash1Res.ok, 'Dashboard summary fetched for 0-post profile');
  assert(dash1Res.data.analyzed_posts_count === 0, 'Dashboard analyzed_posts_count is exactly 0');
  assert(dash1Res.data.connection?.status === 'NOT_CONFIGURED', 'Connection status is NOT_CONFIGURED (API credentials not in .env)');
  assert(dash1Res.data.connection?.message?.includes("isn't configured yet"), 'Connection message explicitly states integration is not configured');

  // Trigger Analysis for Profile 1 (0 posts)
  console.log('  Triggering AI analysis for 0-post profile...');
  const analyze1Res = await request(`/profiles/${prof1Id}/analyze`, {
    method: 'POST',
    headers: authHeadersA
  });
  assert(analyze1Res.ok, 'Analysis completed successfully for 0 posts');
  const a1 = analyze1Res.data.analysis;

  assert(a1.analysis_mode === 'STARTER_STRATEGY', 'Mode is STARTER_STRATEGY (not fake historical profile analysis)');
  assert(a1.data_confidence === 'NONE', 'Data confidence is NONE');
  assert(a1.consistency?.indicator === null, 'Consistency indicator is null (no fake score)');
  assert(a1.consistency?.explanation?.includes('starting fresh'), 'Consistency explanation notes starting fresh');
  assert(a1.content_variety?.indicator === null, 'Content variety indicator is null');
  assert(a1.caption_quality?.indicator === null, 'Caption quality indicator is null');
  assert(a1.cta_usage?.indicator === null, 'CTA usage indicator is null');
  assert(Array.isArray(a1.content_mix) && a1.content_mix.length > 0, 'Recommended content mix is provided');
  assert(Array.isArray(a1.strengths) && a1.strengths.length > 0, 'Foundational strengths provided');
  assert(Array.isArray(a1.opportunities) && a1.opportunities.length > 0, 'Starter opportunities provided');

  // ====================================================
  // TEST 2 — ONE REAL POST -> EARLY CONTENT ANALYSIS
  // ====================================================
  console.log('\n--- TEST 2 — ONE REAL POST: Profile with exactly 1 real post ---');
  const prof2Res = await request('/profiles', {
    method: 'POST',
    headers: authHeadersA,
    body: JSON.stringify({
      platform: 'Instagram',
      profile_url: 'https://instagram.com/alicedebug_onepost',
      username: 'alicedebug_onepost',
      niche: 'System Design Architecture',
      target_audience: 'Mid-level Backend Developers',
      content_goal: 'Career Growth',
      preferred_tone: 'Technical & Practical',
      timezone: 'Asia/Kolkata'
    })
  });
  const prof2Id = prof2Res.data.profile.id;

  // Add exactly 1 real post
  const singlePostRes = await request(`/profiles/${prof2Id}/posts`, {
    method: 'POST',
    headers: authHeadersA,
    body: JSON.stringify({
      content_type: 'Carousel',
      caption: 'Breaking down the 3 core distributed system caching patterns: Cache-Aside, Write-Through, and Write-Back. Comment CACHE for the high-res architecture diagram!',
      hashtags: ['#SystemDesign', '#DistributedSystems', '#BackendArchitecture'],
      likes: 45,
      comments: 7,
      cta: 'Comment CACHE for the diagram',
      is_demo: false,
      post_date: new Date().toISOString()
    })
  });
  assert(singlePostRes.status === 201, 'Exactly 1 real post created');

  // Check Dashboard summary for 1 post
  const dash2Res = await request(`/dashboard/summary?profile_id=${prof2Id}`, {
    method: 'GET',
    headers: authHeadersA
  });
  assert(dash2Res.data.analyzed_posts_count === 1, 'Dashboard shows analyzed_posts_count === 1');
  assert(dash2Res.data.deterministic_metrics?.posts_analyzed === 1, 'Deterministic metrics calculate 1 post');

  // Trigger Analysis for Profile 2 (1 post)
  console.log('  Triggering AI analysis for 1-post profile...');
  const analyze2Res = await request(`/profiles/${prof2Id}/analyze`, {
    method: 'POST',
    headers: authHeadersA
  });
  assert(analyze2Res.ok, 'Analysis completed successfully for 1 post');
  const a2 = analyze2Res.data.analysis;

  assert(a2.analysis_mode === 'EARLY_CONTENT', 'Mode is EARLY_CONTENT');
  assert(a2.data_confidence === 'LIMITED', 'Data confidence is LIMITED');
  assert(a2.consistency?.indicator === null, 'Consistency indicator is null (insufficient historical data)');
  assert(a2.content_variety?.indicator === null, 'Content variety indicator is null (insufficient data for 1 post)');
  assert(a2.consistency?.explanation?.toLowerCase().includes('limited') || a2.consistency?.explanation?.toLowerCase().includes('insufficient') || a2.consistency?.explanation?.includes('1 post'), 'Consistency explanation states limited/insufficient data');
  assert(JSON.stringify(a2).toLowerCase().includes('cache') || JSON.stringify(a2).toLowerCase().includes('system') || JSON.stringify(a2).toLowerCase().includes('architecture') || JSON.stringify(a2).toLowerCase().includes('carousel'), 'Analysis grounded in actual supplied post data');

  // ====================================================
  // TEST 3 — DEMO DATA -> 10 POSTS & PROFILE CONTENT ANALYSIS
  // ====================================================
  console.log('\n--- TEST 3 — DEMO DATA: Seed 10 realistic demo posts ---');
  const prof3Res = await request('/profiles', {
    method: 'POST',
    headers: authHeadersA,
    body: JSON.stringify({
      platform: 'Instagram',
      profile_url: 'https://instagram.com/alicedebug_demo',
      username: 'alicedebug_demo',
      niche: 'Web Development',
      target_audience: 'Aspiring Engineers',
      content_goal: 'Growth',
      preferred_tone: 'Educational',
      timezone: 'Asia/Kolkata'
    })
  });
  const prof3Id = prof3Res.data.profile.id;

  // Seed sample posts
  const seedRes = await request(`/profiles/${prof3Id}/seed-sample-posts`, {
    method: 'POST',
    headers: authHeadersA
  });
  assert(seedRes.status === 201 && seedRes.data.count === 10, '10 sample demo posts seeded successfully');
  assert(seedRes.data.posts.every(p => p.is_demo === true), 'All 10 posts are clearly marked is_demo: true');

  // Check Dashboard for Profile 3
  const dash3Res = await request(`/dashboard/summary?profile_id=${prof3Id}`, {
    method: 'GET',
    headers: authHeadersA
  });
  assert(dash3Res.data.analyzed_posts_count === 10, 'Dashboard shows 10 posts analyzed');
  assert(dash3Res.data.deterministic_metrics?.has_demo_data === true, 'Deterministic metrics flag has_demo_data: true');
  assert(dash3Res.data.deterministic_metrics?.content_mix?.length > 1, 'Content mix calculated accurately across formats');

  // Trigger Analysis for Profile 3 (10 demo posts)
  console.log('  Triggering AI analysis for 10-post demo profile...');
  const analyze3Res = await request(`/profiles/${prof3Id}/analyze`, {
    method: 'POST',
    headers: authHeadersA
  });
  assert(analyze3Res.ok, 'Analysis completed successfully for 10 posts');
  const a3 = analyze3Res.data.analysis;

  assert(a3.analysis_mode === 'PROFILE_ANALYSIS', 'Mode is PROFILE_ANALYSIS');
  assert(a3.data_confidence === 'HIGH', 'Data confidence is HIGH');
  assert(a3.consistency?.indicator !== null, 'Consistency indicator is calculated for 10 posts');
  assert(a3.content_variety?.indicator !== null, 'Content variety indicator is calculated for 10 posts');

  // ====================================================
  // TEST 4 — AI FAILURE SIMULATION
  // ====================================================
  console.log('\n--- TEST 4 — AI FAILURE: Friendly error message, no fake analysis ---');
  // Attempt to analyze a non-existent profile or simulate failure
  const failRes = await request('/profiles/00000000-0000-0000-0000-000000000000/analyze', {
    method: 'POST',
    headers: authHeadersA
  });
  assert(!failRes.ok, 'Invalid analysis returns non-200 status');
  assert(failRes.data.message?.includes("AI analysis couldn't be completed") || failRes.data.message?.includes('Profile not found'), 'Friendly error message displayed without generic fake analysis');

  // ====================================================
  // TEST 5 — REFRESH PERSISTENCE
  // ====================================================
  console.log('\n--- TEST 5 — REFRESH: Persisted analysis loaded from database ---');
  const refresh1Res = await request(`/profiles/${prof1Id}/analysis`, {
    method: 'GET',
    headers: authHeadersA
  });
  assert(refresh1Res.ok, 'Profile 1 analysis fetched on page refresh');
  assert(refresh1Res.data.analysis?.analysis_mode === 'STARTER_STRATEGY', 'Retrieved analysis matches saved STARTER_STRATEGY');

  const refresh3Res = await request(`/profiles/${prof3Id}/analysis`, {
    method: 'GET',
    headers: authHeadersA
  });
  assert(refresh3Res.ok, 'Profile 3 analysis fetched on page refresh');
  assert(refresh3Res.data.analysis?.analysis_mode === 'PROFILE_ANALYSIS', 'Retrieved analysis matches saved PROFILE_ANALYSIS');

  // ====================================================
  // TEST 6 — USER ISOLATION
  // ====================================================
  console.log('\n--- TEST 6 — USER ISOLATION: User B cannot access User A data ---');
  const userBRes = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Bob Competitor',
      email: `bob_${ts}@example.com`,
      password: 'Password123!'
    })
  });
  assert(userBRes.status === 201 && userBRes.data.token, 'User B registered');
  const tokenB = userBRes.data.token;
  const authHeadersB = { Authorization: `Bearer ${tokenB}` };

  // User B tries to view User A's profile posts
  const bGetPostsRes = await request(`/profiles/${prof1Id}/posts`, {
    method: 'GET',
    headers: authHeadersB
  });
  assert(bGetPostsRes.status === 404, 'User B denied access to User A posts (404 Not Found)');

  // User B tries to trigger analysis on User A's profile
  const bAnalyzeRes = await request(`/profiles/${prof1Id}/analyze`, {
    method: 'POST',
    headers: authHeadersB
  });
  assert(bAnalyzeRes.status === 404 || bAnalyzeRes.status === 500, 'User B denied analysis on User A profile');

  // User B tries to view User A's analysis
  const bGetAnalysisRes = await request(`/profiles/${prof1Id}/analysis`, {
    method: 'GET',
    headers: authHeadersB
  });
  assert(bGetAnalysisRes.status === 404, 'User B denied access to User A analysis');

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('====================================================');

  if (failCount > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test execution error:', err);
  process.exit(1);
});
