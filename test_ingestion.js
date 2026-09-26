// Automated test script for Instagram Post Ingestion & Dashboard Metrics
const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- Starting Instagram Post Ingestion Verification Suite ---');
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

  // 1. Create a test user & login
  let token = null;
  const testEmail = `creator_ingest_${Date.now()}@example.com`;

  try {
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ingestion Tester',
        email: testEmail,
        password: 'password123',
        confirmPassword: 'password123'
      })
    });
    const regData = await regRes.json();
    token = regData.token;
    assert(regRes.status === 201 && token, 'Registered test user');
  } catch (err) {
    assert(false, 'Register user', err.message);
    process.exit(1);
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 2. Create a social profile
  let profileId = null;
  try {
    const pRes = await fetch(`${BASE_URL}/profiles`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        platform: 'Instagram',
        profile_url: 'https://instagram.com/tech_creator_official',
        username: 'tech_creator_official',
        niche: 'Web Development',
        target_audience: 'Aspiring Software Engineers',
        content_goal: 'Engagement & Education',
        preferred_tone: 'Direct & Actionable'
      })
    });
    const pData = await pRes.json();
    profileId = pData.profile?.id;
    assert(pRes.status === 201 && profileId, 'Created social profile for Instagram');
  } catch (err) {
    assert(false, 'Create profile', err.message);
    process.exit(1);
  }

  // 3. Option 1: Load 10 Demo Sample Posts
  try {
    const seedRes = await fetch(`${BASE_URL}/profiles/${profileId}/seed-sample-posts`, {
      method: 'POST',
      headers: authHeaders
    });
    const seedData = await seedRes.json();
    assert(seedRes.status === 201 && seedData.posts?.length === 10, 'Option A: Seed 10 realistic demo posts', `Count: ${seedData.posts?.length}`);

    // Verify fields in demo posts
    const firstPost = seedData.posts[0];
    assert(
      firstPost.post_date &&
      firstPost.content_type &&
      firstPost.caption &&
      firstPost.cta &&
      firstPost.is_demo === true,
      'Demo posts contain date, content_type, caption, CTA, and is_demo = true',
      JSON.stringify(firstPost)
    );
  } catch (err) {
    assert(false, 'Seed demo posts', err.message);
  }

  // 4. Option 2: Add Manual Posts Batch
  try {
    const manualBatch = [
      {
        content_type: 'Reel',
        post_date: new Date().toISOString(),
        caption: '5 VS Code shortcuts that save 2 hours every single week. Did you know shortcut #3?',
        likes: 120,
        comments: 15,
        hashtags: ['#vscode', '#productivity'],
        cta: 'Save this reel for your next coding session',
        is_demo: false
      },
      {
        content_type: 'Carousel',
        post_date: new Date(Date.now() - 2 * 86400000).toISOString(),
        caption: 'SQL JOIN explained visually with Venn diagrams and clear query output.',
        likes: 310,
        comments: 28,
        hashtags: ['#sql', '#database'],
        cta: 'Comment SQL for the full high-res PDF',
        is_demo: false
      }
    ];

    const manualRes = await fetch(`${BASE_URL}/profiles/${profileId}/posts/batch`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ posts: manualBatch })
    });
    const manualData = await manualRes.json();
    assert(manualRes.status === 201 && manualData.posts?.length === 2, 'Option B: Add manual posts batch', `Count: ${manualData.posts?.length}`);
  } catch (err) {
    assert(false, 'Manual posts batch', err.message);
  }

  // 5. Option 3: Bulk CSV Ingestion
  try {
    const csvBatch = [
      {
        content_type: 'Story',
        post_date: new Date(Date.now() - 4 * 86400000).toISOString(),
        caption: 'Sunday dev AMA: What is your biggest struggle right now with React or Node?',
        likes: 45,
        comments: 32,
        hashtags: ['#ama', '#community'],
        cta: 'Reply directly to this story with your question',
        is_demo: false
      }
    ];

    const csvRes = await fetch(`${BASE_URL}/profiles/${profileId}/posts/batch`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ posts: csvBatch })
    });
    const csvData = await csvRes.json();
    assert(csvRes.status === 201 && csvData.posts?.length === 1, 'Option C: Import parsed CSV post batch');
  } catch (err) {
    assert(false, 'CSV batch import', err.message);
  }

  // 6. Verify Dashboard Summary with Deterministic Metrics
  try {
    const dashRes = await fetch(`${BASE_URL}/dashboard/summary?profile_id=${profileId}`, {
      headers: authHeaders
    });
    const dashData = await dashRes.json();

    assert(dashRes.status === 200, 'Dashboard summary returns HTTP 200');
    assert(dashData.analyzed_posts_count === 13, 'Dashboard reports exact total posts analyzed (10 demo + 3 custom = 13)', `Got: ${dashData.analyzed_posts_count}`);

    const metrics = dashData.deterministic_metrics;
    assert(metrics && Array.isArray(metrics.content_mix) && metrics.content_mix.length > 0, 'Dashboard includes verified Content Mix breakdown');
    assert(metrics && metrics.average_engagement, `Dashboard includes Average Engagement: ${metrics?.average_engagement}`);
    assert(metrics && metrics.posting_frequency, `Dashboard includes Posting Frequency: ${metrics?.posting_frequency}`);
    assert(metrics && metrics.content_consistency, `Dashboard includes Content Consistency: ${metrics?.content_consistency}`);
    assert(metrics && metrics.content_variety, `Dashboard includes Content Variety: ${metrics?.content_variety}`);
    assert(metrics && metrics.has_demo_data === true, 'Dashboard accurately indicates has_demo_data is true');
  } catch (err) {
    assert(false, 'Dashboard metrics', err.message);
  }

  // 7. Verify "Analyze My Content" Trigger
  try {
    console.log('Testing Analyze My Content trigger...');
    const analyzeRes = await fetch(`${BASE_URL}/profiles/${profileId}/analyze`, {
      method: 'POST',
      headers: authHeaders
    });
    const analyzeData = await analyzeRes.json();
    assert(analyzeRes.status === 200 && analyzeData.analysis, 'Analyze My Content succeeds with structured analysis based on stored post data');
  } catch (err) {
    assert(false, 'Analyze my content', err.message);
  }

  console.log(`\n========================================`);
  console.log(`Post Ingestion Test Results: ${passed} / ${total} tests passed!`);
  console.log(`========================================`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests();
