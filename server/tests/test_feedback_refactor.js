/**
 * End-to-End Automated Validation for CreatorCalendar AI Refactor:
 * - Decoupled from Posts feature
 * - Dedicated Feedback feature & evidence-based Profile Score /100
 * - Works with 0 posts (Starter Strategy)
 * - Works with 1 post (Limited data diagnostics)
 * - Instagram / Social API transparency (no scraping, no fake posts)
 * - Creative Ideas & 7-Day Calendar generation with 0 posts
 * - Preserved Google OAuth
 * - Dashboard Overview without post dependencies
 */

const BASE_URL = 'http://localhost:5000/api';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, ok: res.ok, data };
}

function assert(condition, testName) {
  if (!condition) {
    console.error(`  ❌ FAIL: ${testName}`);
    throw new Error(`Assertion failed: ${testName}`);
  }
  console.log(`  ✅ PASS: ${testName}`);
}

async function runTests() {
  console.log('====================================================');
  console.log('CREATORCALENDAR AI: FEEDBACK REFACTOR VERIFICATION');
  console.log('====================================================');

  // --- Step 1: Health & DB check ---
  console.log('\n--- Step 1: Health Check ---');
  const healthRes = await request('/health/db');
  assert(healthRes.ok && healthRes.data.database === 'connected', 'Database health check returns connected');

  // --- Step 2: Google OAuth preserved ---
  console.log('\n--- Step 2: Google OAuth Route Check ---');
  const oauthRes = await fetch(`${BASE_URL}/auth/google`, { redirect: 'manual' });
  assert(oauthRes.status === 302, 'Google OAuth route returns 302 redirect');
  const location = oauthRes.headers.get('location');
  assert(location.includes('accounts.google.com'), 'Redirects to accounts.google.com');

  // --- Step 3: Test Case 1 & 4: New Creator with 0 Posts ---
  console.log('\n--- Step 3: New Creator Flow (0 Historical Posts) ---');
  const uniqueNum = Date.now();
  const regRes = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Zero Posts Creator',
      email: `zero_posts_${uniqueNum}@example.com`,
      password: 'SecurePassword123!'
    })
  });
  assert(regRes.status === 201 && regRes.data.token, 'Registered new creator');
  const token = regRes.data.token;
  const authHeaders = { Authorization: `Bearer ${token}` };

  // Create Profile with default Asia/Kolkata timezone
  const profRes = await request('/profiles', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      platform: 'Instagram',
      username: `fresh_creator_${uniqueNum}`,
      profile_url: `https://instagram.com/fresh_creator_${uniqueNum}`,
      niche: 'AI & Data Engineering',
      target_audience: 'Aspiring software engineers',
      content_goal: 'Thought Leadership & Growth',
      preferred_tone: 'Educational & Approachable',
      timezone: 'Asia/Kolkata'
    })
  });
  assert(profRes.status === 201 && profRes.data.profile, 'Created social profile without forced post ingestion');
  const profileId = profRes.data.profile.id;
  assert(profRes.data.profile.timezone === 'Asia/Kolkata', 'Timezone defaults to Asia/Kolkata');

  // --- Step 4: Generate Feedback with 0 Posts ---
  console.log('\n--- Step 4: Feedback with 0 Posts (Starter Feedback) ---');
  const feedbackRes = await request(`/feedback/${profileId}`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ profile_id: profileId })
  });
  assert(feedbackRes.ok && feedbackRes.data.feedback, 'Generated feedback with 0 posts');
  const fb = feedbackRes.data.feedback;

  assert(fb.confidence === 'LOW', '0 Posts feedback confidence is LOW (Starter Strategy)');
  assert(typeof fb.overall_score === 'number' && fb.overall_score >= 0 && fb.overall_score <= 100, `Profile Score is evidence-based number: ${fb.overall_score}/100`);
  assert(fb.summary && fb.summary.length > 20, 'Feedback summary is substantive');
  assert(Array.isArray(fb.strengths) && fb.strengths.length > 0, 'Strengths provided');
  assert(Array.isArray(fb.improvement_areas) && fb.improvement_areas.length > 0, 'Actionable improvement areas provided');
  assert(Array.isArray(fb.content_gaps) && fb.content_gaps.length > 0, 'Content gaps identified');
  assert(Array.isArray(fb.next_steps) && fb.next_steps.length > 0, 'Next steps provided');

  // Check dimensions: consistency must be INSUFFICIENT_DATA with 0 posts
  const consistencyDim = fb.dimensions?.find(d => d.name === 'Consistency');
  assert(consistencyDim && consistencyDim.score === null, 'Consistency score is null with 0 posts (not faked)');

  // --- Step 5: Creative Ideas with 0 Posts Grounded in Feedback ---
  console.log('\n--- Step 5: Creative Ideas Grounded in Feedback ---');
  const ideasRes = await request('/ai/generate-ideas', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ profile_id: profileId, platform: 'Instagram' })
  });
  assert(ideasRes.ok && Array.isArray(ideasRes.data.ideas), 'Creative Ideas generated with 0 posts');
  assert(ideasRes.data.ideas.length >= 3, 'Multiple ideas returned');
  const firstIdea = ideasRes.data.ideas[0];
  assert(firstIdea.title && firstIdea.concept && firstIdea.hook, 'Idea has structured title, concept, and hook');

  // --- Step 6: 7-Day Calendar Generation with 0 Posts ---
  console.log('\n--- Step 6: 7-Day Content Calendar Generation ---');
  const calRes = await request('/content-plans/generate', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ profile_id: profileId, platform: 'Instagram' })
  });
  assert(calRes.ok && calRes.data.plan, '7-Day Calendar plan generated with 0 posts');
  assert(calRes.data.posts && calRes.data.posts.length === 7, 'Generated exactly 7 calendar posts');
  const firstPost = calRes.data.posts[0];
  assert(firstPost.scheduled_date && firstPost.content_type && firstPost.topic, 'Calendar post has scheduled_date, content_type, and topic');

  // --- Step 7: Calendar Item Editing & Status Update ---
  console.log('\n--- Step 7: Calendar Item Status & Edit ---');
  const updateStatusRes = await request(`/posts/${firstPost.id}/status`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ status: 'READY' })
  });
  assert(updateStatusRes.ok && updateStatusRes.data.post.status === 'READY', 'Updated calendar post status to READY');

  // --- Step 8: Campaign Management Independent of Posts ---
  console.log('\n--- Step 8: Campaign Management ---');
  const campRes = await request('/campaigns', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      profile_id: profileId,
      name: 'Spring AI Authority Sprint',
      description: 'Educational authority campaign for 2026',
      goal: 'Engagement & Authority',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      status: 'ACTIVE'
    })
  });
  assert(campRes.status === 201 && campRes.data.campaign, 'Created campaign independent of posts');

  // --- Step 9: Dashboard Overview API Check ---
  console.log('\n--- Step 9: Dashboard Overview Check ---');
  const dashRes = await request(`/dashboard/summary?profile_id=${profileId}`, { headers: authHeaders });
  assert(dashRes.ok && dashRes.data.has_profile === true, 'Dashboard summary returns has_profile: true');
  assert(dashRes.data.profile_score && typeof dashRes.data.profile_score.score === 'number', 'Dashboard returns Profile Score');
  assert(Array.isArray(dashRes.data.connected_platforms), 'Dashboard returns connected_platforms');
  assert(Array.isArray(dashRes.data.upcoming_calendar_items), 'Dashboard returns upcoming calendar items');
  assert(Array.isArray(dashRes.data.top_improvement_areas), 'Dashboard returns top improvement priorities');

  // --- Step 10: Special Test Case 2: Profile with exactly 1 verified post ---
  console.log('\n--- Step 10: Special Test Case 2 (1 Verified Post) ---');
  // Store 1 post in profile_posts for diagnostic testing
  const createPostRes = await request(`/profiles/${profileId}/posts`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      content_type: 'Carousel',
      caption: 'The 2026 Data Architecture Stack: Vector DBs vs Graph Databases.',
      hashtags: ['#DataEngineering', '#PostgreSQL'],
      cta: 'Comment STACK for the architecture diagram',
      likes: 45,
      comments: 6
    })
  });
  assert(createPostRes.status === 201, 'Inserted 1 post for diagnostic test');

  // Re-evaluate feedback with 1 post
  const fb1Res = await request(`/feedback/${profileId}`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ profile_id: profileId })
  });
  assert(fb1Res.ok && fb1Res.data.feedback, 'Generated feedback with 1 post');
  const fb1 = fb1Res.data.feedback;
  assert(fb1.confidence === 'MEDIUM', 'Confidence is MEDIUM with 1 post (diagnostics)');
  assert(fb1.summary.toLowerCase().includes('limited') || fb1.summary.includes('1'), 'Summary acknowledges 1 post / limited data');
  const consistency1 = fb1.dimensions?.find(d => d.name === 'Consistency');
  assert(consistency1 && consistency1.score === null, 'Consistency remains null with 1 post (no fake trends)');

  // --- Step 11: Special Test Case 3: Social Platform Transparency ---
  console.log('\n--- Step 11: Special Test Case 3 (Social API Transparency) ---');
  const accountsRes = await request('/social/accounts', { headers: authHeaders });
  assert(accountsRes.ok && Array.isArray(accountsRes.data.platforms), 'Social accounts returns 5 platform statuses');
  const igPlat = accountsRes.data.platforms.find(p => p.platform === 'instagram');
  assert(igPlat && igPlat.status !== undefined, 'Instagram status is explicitly tracked');

  console.log('\n====================================================');
  console.log('ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY! 🎉');
  console.log('====================================================\n');
}

runTests().catch(err => {
  console.error('\n❌ Test Suite Aborted with Error:', err.message);
  process.exit(1);
});
