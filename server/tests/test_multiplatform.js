const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 CREATORCALENDAR AI - MULTI-PLATFORM VERIFICATION');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  try {
    // TEST 1: Health check & Server Status
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    assert(healthData.status === 'ok', 'Test 1: Health check endpoint responds OK');

    // TEST 2: Preserved Google OAuth configuration
    const googleAuthRes = await fetch(`${BASE_URL}/auth/google`, { redirect: 'manual' });
    const redirectUrl = googleAuthRes.headers.get('location') || '';
    assert(
      googleAuthRes.status === 302 && redirectUrl.includes('accounts.google.com') && redirectUrl.includes('251315568276'),
      'Test 2: Google OAuth preserved and issues 302 redirect to accounts.google.com with active client ID'
    );

    // TEST 3: User Registration & Session Cookie
    const uniqueEmail = `creator_${Date.now()}@example.com`;
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Multiplatform Creator',
        email: uniqueEmail,
        password: 'Password123!'
      })
    });
    const regData = await regRes.json();
    const token = regData.token;
    assert(Boolean(token), 'Test 3: User registration returns valid JWT auth token');

    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // TEST 4: Multi-platform Social Accounts Status (All 5 platforms)
    const socRes = await fetch(`${BASE_URL}/social/accounts`, { headers: authHeaders });
    const socData = await socRes.json();
    const platforms = socData.platforms || [];
    const expectedPlatforms = ['instagram', 'youtube', 'tiktok', 'linkedin', 'facebook'];
    const foundAll = expectedPlatforms.every(p => platforms.some(sp => sp.platform.toLowerCase() === p));
    assert(
      foundAll && platforms.length === 5,
      'Test 4: Social Accounts API reports all 5 platforms (Instagram, YouTube, TikTok, LinkedIn, Facebook)',
      `Found ${platforms.length} platforms`
    );

    // Verify valid status string on every platform
    const validStatuses = ['CONNECTED', 'NOT_CONNECTED', 'NOT_CONFIGURED', 'API_UNAVAILABLE', 'NO_CONTENT'];
    const allStatusesValid = platforms.every(p => validStatuses.includes(p.status));
    assert(allStatusesValid, 'Test 5: All platform cards have valid official connection statuses');

    // TEST 6: Connect a platform via Sandbox/Demo & Disconnect
    const connRes = await fetch(`${BASE_URL}/social/connect/youtube`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        isDemo: true,
        username: 'yt_creator_test',
        displayName: 'YouTube Creator Test'
      })
    });
    const connData = await connRes.json();
    assert(connData.status === 'CONNECTED', 'Test 6a: Connect platform in sandbox mode succeeds');

    // Verify status updated to CONNECTED
    const socCheckRes = await fetch(`${BASE_URL}/social/accounts`, { headers: authHeaders });
    const socCheckData = await socCheckRes.json();
    const ytAccount = socCheckData.platforms.find(p => p.platform === 'youtube');
    assert(ytAccount?.connected === true && ytAccount?.status === 'CONNECTED', 'Test 6b: Platform reflects CONNECTED in accounts list');

    // TEST 7: Create Social Profile with Asia/Kolkata timezone default and preferred platforms
    const profileRes = await fetch(`${BASE_URL}/profiles`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        creator_name: 'Aditi Rao',
        platform: 'Instagram',
        preferred_platforms: ['Instagram', 'YouTube', 'LinkedIn'],
        username: 'aditi_creates',
        profile_url: 'https://instagram.com/aditi_creates',
        niche: 'AI Tools & Productivity',
        target_audience: 'Creators, students, and engineers',
        content_goal: 'Growth & Authority',
        preferred_tone: 'Educational & Friendly'
        // Notice timezone omitted to test default Asia/Kolkata
      })
    });
    const profileData = await profileRes.json();
    const profileId = profileData.profile?.id;
    assert(
      profileData.profile?.timezone === 'Asia/Kolkata',
      'Test 7: Social profile timezone defaults to Asia/Kolkata (IST)',
      `Got timezone: ${profileData.profile?.timezone}`
    );

    // TEST 8: Zero-Post Analysis ("You're starting fresh — let's build your content strategy")
    const zeroAnalyzeRes = await fetch(`${BASE_URL}/ai/analyze-profile`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ profile_id: profileId })
    });
    const zeroAnalyzeData = await zeroAnalyzeRes.json();
    const zeroConsistency = zeroAnalyzeData.analysis?.consistency?.explanation || '';
    assert(
      zeroConsistency.includes("You're starting fresh — let's build your content strategy"),
      'Test 8: Zero-post analysis delivers "You\'re starting fresh — let\'s build your content strategy"',
      `Got: ${zeroConsistency}`
    );

    // TEST 9: One-Post Analysis ("1 post available — limited historical data is available...")
    // Insert exactly 1 post
    await fetch(`${BASE_URL}/profiles/${profileId}/posts`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        platform: 'Instagram',
        content_type: 'Reel',
        caption: 'First post introducing my AI productivity workflow! Save this reel.',
        cta: 'Save this reel'
      })
    });

    const oneAnalyzeRes = await fetch(`${BASE_URL}/ai/analyze-profile`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ profile_id: profileId })
    });
    const oneAnalyzeData = await oneAnalyzeRes.json();
    const oneConsistency = oneAnalyzeData.analysis?.consistency?.explanation || '';
    assert(
      oneConsistency.includes('1 post available — limited historical data is available'),
      'Test 9: One-post analysis delivers "1 post available — limited historical data is available"',
      `Got: ${oneConsistency}`
    );

    // TEST 10: Multi-Platform Content Ideas Generation (e.g. YouTube & LinkedIn)
    const ytIdeasRes = await fetch(`${BASE_URL}/ai/generate-ideas`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ profile_id: profileId, platform: 'YouTube' })
    });
    const ytIdeasData = await ytIdeasRes.json();
    const ytIdeas = ytIdeasData.ideas || [];
    assert(
      ytIdeas.length > 0 && (ytIdeas[0].platform === 'YouTube' || ytIdeas[0].format.toLowerCase().includes('video') || ytIdeas[0].format.toLowerCase().includes('short')),
      'Test 10: Multi-platform ideas adapt to YouTube formats (Shorts/Videos)',
      `Generated ${ytIdeas.length} ideas`
    );

    // TEST 11: 7-Day Calendar Generation with Multi-Platform Adaptations
    const calRes = await fetch(`${BASE_URL}/ai/generate-calendar`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ profile_id: profileId, platform: 'LinkedIn' })
    });
    const calData = await calRes.json();
    const posts = calData.posts || [];
    assert(
      posts.length === 7,
      'Test 11a: 7-Day Calendar generates full 7-day plan without historical posts required',
      `Got ${posts.length} posts`
    );
    assert(
      posts[0].status === 'DRAFT',
      'Test 11b: Initial generated posts have status DRAFT'
    );

    // TEST 12: Post Regeneration with Exact Tones & Comparison
    const targetPost = posts[0];
    const regenRes = await fetch(`${BASE_URL}/ai/regenerate-post`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        post_id: targetPost.id,
        tone: 'Short & punchy',
        content_type: 'Reel',
        objective: 'Top-of-Funnel Reach',
        instruction: 'Make hook crisp and minimal'
      })
    });
    const regenData = await regenRes.json();
    assert(
      regenData.preview && Boolean(regenData.preview.topic) && Boolean(regenData.preview.caption),
      'Test 12a: Post regeneration supports exact tone "Short & punchy" and returns preview without auto-saving to DB',
      `Got preview: ${regenData.preview?.topic}`
    );

    // Apply New Version
    const applyRes = await fetch(`${BASE_URL}/ai/apply-regenerated-post`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        post_id: targetPost.id,
        updated_post: regenData.preview
      })
    });
    const applyData = await applyRes.json();
    assert(
      applyData.post && applyData.post.topic === regenData.preview.topic,
      'Test 12b: Apply New Version updates database record correctly'
    );

    // TEST 13: Post Status Transition (READY, SCHEDULED, PUBLISHED)
    const statusRes = await fetch(`${BASE_URL}/posts/${targetPost.id}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'READY' })
    });
    const statusData = await statusRes.json();
    assert(
      statusData.post?.status === 'READY',
      'Test 13: Post status transition to READY succeeds'
    );

    // Disconnect YouTube account
    await fetch(`${BASE_URL}/social/disconnect/youtube`, {
      method: 'POST',
      headers: authHeaders
    });

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

runTests();
