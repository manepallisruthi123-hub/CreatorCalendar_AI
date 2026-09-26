const { query } = require('../config/database');
const { socialProfileSchema, updateSocialProfileSchema, profilePostSchema } = require('../schemas/validation.schemas');

// ================= PROFILES =================

async function getProfiles(req, res, next) {
  try {
    const profiles = await query(`
      SELECT sp.*,
             (SELECT COUNT(*) FROM profile_posts WHERE profile_id = sp.id) as post_count,
             (SELECT COUNT(*) FROM profile_analyses WHERE profile_id = sp.id) as analysis_count
      FROM social_profiles sp
      WHERE sp.user_id = $1
      ORDER BY sp.created_at DESC;
    `, [req.user.id]);

    res.json({ profiles: profiles.rows });
  } catch (err) {
    next(err);
  }
}

async function createProfile(req, res, next) {
  try {
    const validated = socialProfileSchema.parse(req.body);

    const insertRes = await query(`
      INSERT INTO social_profiles (
        user_id, platform, profile_url, username, niche,
        target_audience, content_goal, preferred_tone, timezone
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `, [
      req.user.id,
      validated.platform,
      validated.profile_url,
      validated.username.replace(/^@/, ''),
      validated.niche,
      validated.target_audience,
      validated.content_goal,
      validated.preferred_tone,
      validated.timezone
    ]);

    res.status(201).json({
      message: 'Social profile created successfully',
      profile: insertRes.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

async function getProfileById(req, res, next) {
  try {
    const profile = await query(`
      SELECT sp.*,
             (SELECT COUNT(*) FROM profile_posts WHERE profile_id = sp.id) as post_count
      FROM social_profiles sp
      WHERE sp.id = $1 AND sp.user_id = $2;
    `, [req.params.id, req.user.id]);

    if (profile.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Profile not found or access denied'
      });
    }

    res.json({ profile: profile.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const validated = updateSocialProfileSchema.parse(req.body);

    // Verify ownership
    const check = await query('SELECT id FROM social_profiles WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Profile not found' });
    }

    const updates = [];
    const values = [];
    let idx = 1;

    Object.keys(validated).forEach(key => {
      if (validated[key] !== undefined) {
        updates.push(`${key} = $${idx}`);
        values.push(validated[key]);
        idx++;
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Bad Request', message: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(req.params.id);
    values.push(req.user.id);

    const updateQuery = `
      UPDATE social_profiles
      SET ${updates.join(', ')}
      WHERE id = $${idx} AND user_id = $${idx + 1}
      RETURNING *;
    `;

    const result = await query(updateQuery, values);
    res.json({ message: 'Profile updated', profile: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function deleteProfile(req, res, next) {
  try {
    const result = await query(
      'DELETE FROM social_profiles WHERE id = $1 AND user_id = $2 RETURNING id;',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Profile not found' });
    }

    res.json({ message: 'Profile deleted successfully' });
  } catch (err) {
    next(err);
  }
}

// ================= PROFILE POSTS =================

async function getProfilePosts(req, res, next) {
  try {
    // Verify profile ownership first
    const profileCheck = await query(
      'SELECT id FROM social_profiles WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (profileCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Profile not found' });
    }

    const posts = await query(`
      SELECT * FROM profile_posts
      WHERE profile_id = $1 AND user_id = $2
      ORDER BY post_date DESC, created_at DESC;
    `, [req.params.id, req.user.id]);

    res.json({ posts: posts.rows });
  } catch (err) {
    next(err);
  }
}

async function createProfilePost(req, res, next) {
  try {
    const profileId = req.params.id;
    const validated = profilePostSchema.parse(req.body);

    // Verify ownership
    const profileCheck = await query(
      'SELECT id, platform FROM social_profiles WHERE id = $1 AND user_id = $2',
      [profileId, req.user.id]
    );
    if (profileCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Profile not found' });
    }

    const postDate = validated.post_date ? new Date(validated.post_date) : new Date();

    const insertRes = await query(`
      INSERT INTO profile_posts (
        profile_id, user_id, post_date, platform, content_type,
        caption, hashtags, likes, comments, views, reach, engagement_rate
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;
    `, [
      profileId,
      req.user.id,
      postDate,
      validated.platform || profileCheck.rows[0].platform || 'Instagram',
      validated.content_type,
      validated.caption,
      JSON.stringify(validated.hashtags || []),
      validated.likes || 0,
      validated.comments || 0,
      validated.views || 0,
      validated.reach || 0,
      validated.engagement_rate || 0
    ]);

    res.status(201).json({
      message: 'Post added successfully',
      post: insertRes.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

async function batchImportPosts(req, res, next) {
  try {
    const profileId = req.params.id;
    const { posts } = req.body;

    if (!Array.isArray(posts) || posts.length === 0) {
      return res.status(400).json({ error: 'Bad Request', message: 'Posts array is required' });
    }

    // Verify ownership
    const profileCheck = await query(
      'SELECT id, platform FROM social_profiles WHERE id = $1 AND user_id = $2',
      [profileId, req.user.id]
    );
    if (profileCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Profile not found' });
    }

    const inserted = [];
    for (const postData of posts) {
      const validated = profilePostSchema.parse(postData);
      const postDate = validated.post_date ? new Date(validated.post_date) : new Date();

      const insertRes = await query(`
        INSERT INTO profile_posts (
          profile_id, user_id, post_date, platform, content_type,
          caption, hashtags, likes, comments, views, reach, engagement_rate
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *;
      `, [
        profileId,
        req.user.id,
        postDate,
        validated.platform || 'Instagram',
        validated.content_type,
        validated.caption,
        JSON.stringify(validated.hashtags || []),
        validated.likes || 0,
        validated.comments || 0,
        validated.views || 0,
        validated.reach || 0,
        validated.engagement_rate || 0
      ]);
      inserted.push(insertRes.rows[0]);
    }

    res.status(201).json({
      message: `Successfully imported ${inserted.length} posts`,
      posts: inserted
    });
  } catch (err) {
    next(err);
  }
}

async function seedSamplePosts(req, res, next) {
  try {
    const profileId = req.params.id;
    const profileCheck = await query(
      'SELECT * FROM social_profiles WHERE id = $1 AND user_id = $2',
      [profileId, req.user.id]
    );
    if (profileCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Profile not found' });
    }

    const profile = profileCheck.rows[0];
    const niche = profile.niche || 'Technology';

    // 10 realistic posts matching the demo specification
    const samplePosts = [
      {
        content_type: 'Carousel',
        caption: '5 fundamental clean architecture principles every developer should memorize. 1. Single Responsibility 2. Inversion of Control 3. Strict Boundary Isolation 4. Clear DTOs 5. Parameterized Queries. Save for later!',
        hashtags: ['#CleanArchitecture', '#CodingTips', '#TechEducation', '#SoftwareEngineering'],
        likes: 245,
        comments: 18,
        views: 3100,
        reach: 2800,
        engagement_rate: 8.4,
        post_date: new Date(Date.now() - 1 * 86400000).toISOString()
      },
      {
        content_type: 'Carousel',
        caption: 'How to structure your full-stack project in 2026. Stop putting API calls directly inside UI components. Here is our recommended multi-tier folder hierarchy.',
        hashtags: ['#WebDevelopment', '#FullStack', '#ProgrammingGuide'],
        likes: 189,
        comments: 12,
        views: 2400,
        reach: 2100,
        engagement_rate: 7.8,
        post_date: new Date(Date.now() - 3 * 86400000).toISOString()
      },
      {
        content_type: 'Carousel',
        caption: 'Top 4 database indexing mistakes that slow down production queries. Slide 3 is the most common reason Postgres falls back to sequential scans.',
        hashtags: ['#Postgres', '#DatabaseOptimization', '#BackendDev'],
        likes: 312,
        comments: 29,
        views: 4200,
        reach: 3800,
        engagement_rate: 8.9,
        post_date: new Date(Date.now() - 5 * 86400000).toISOString()
      },
      {
        content_type: 'Carousel',
        caption: 'The complete roadmap to mastering backend development as a student. Start with relational modeling before diving into microservices hype.',
        hashtags: ['#StudentDeveloper', '#CareerRoadmap', '#LearnTech'],
        likes: 420,
        comments: 34,
        views: 5600,
        reach: 5100,
        engagement_rate: 8.9,
        post_date: new Date(Date.now() - 7 * 86400000).toISOString()
      },
      {
        content_type: 'Reel',
        caption: 'When you test in production on a Friday at 4:59 PM... 💀 Never push without running your unit tests first!',
        hashtags: ['#DeveloperHumor', '#CodeLife', '#TechRelatable'],
        likes: 580,
        comments: 42,
        views: 8900,
        reach: 7500,
        engagement_rate: 8.2,
        post_date: new Date(Date.now() - 9 * 86400000).toISOString()
      },
      {
        content_type: 'Carousel',
        caption: 'Understanding JWT vs Session Cookies in 5 minutes. Security trade-offs, revocation strategies, and local storage caveats.',
        hashtags: ['#WebSecurity', '#JWT', '#AuthBestPractices'],
        likes: 215,
        comments: 14,
        views: 2800,
        reach: 2500,
        engagement_rate: 9.1,
        post_date: new Date(Date.now() - 11 * 86400000).toISOString()
      },
      {
        content_type: 'Carousel',
        caption: 'Essential Git commands that beyond push and pull. git bisect, git cherry-pick, and rebase interactive walkthrough.',
        hashtags: ['#GitTips', '#VersionControl', '#DevTools'],
        likes: 198,
        comments: 8,
        views: 2300,
        reach: 2000,
        engagement_rate: 10.3,
        post_date: new Date(Date.now() - 13 * 86400000).toISOString()
      },
      {
        content_type: 'Story',
        caption: 'Quick question for the community: Are you using TypeScript on all your personal projects now, or sticking with vanilla JS?',
        hashtags: ['#TypeScript', '#WebDevPoll'],
        likes: 85,
        comments: 45,
        views: 1200,
        reach: 1100,
        engagement_rate: 11.8,
        post_date: new Date(Date.now() - 15 * 86400000).toISOString()
      },
      {
        content_type: 'Carousel',
        caption: 'Why asynchronous programming trips up every beginner. Visual explanation of the Node.js event loop and microtask queue.',
        hashtags: ['#NodeJS', '#AsyncAwait', '#JavaScriptInternals'],
        likes: 290,
        comments: 21,
        views: 3900,
        reach: 3400,
        engagement_rate: 9.1,
        post_date: new Date(Date.now() - 17 * 86400000).toISOString()
      },
      {
        content_type: 'Static Post',
        caption: 'Reminder: You do not need to learn every new framework that drops on Twitter. Master one strong stack deeply.',
        hashtags: ['#DeveloperMindset', '#Focus', '#TechWisdom'],
        likes: 340,
        comments: 19,
        views: 3700,
        reach: 3300,
        engagement_rate: 10.8,
        post_date: new Date(Date.now() - 19 * 86400000).toISOString()
      }
    ];

    const inserted = [];
    for (const postData of samplePosts) {
      const res = await query(`
        INSERT INTO profile_posts (
          profile_id, user_id, post_date, platform, content_type,
          caption, hashtags, likes, comments, views, reach, engagement_rate
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *;
      `, [
        profileId,
        req.user.id,
        new Date(postData.post_date),
        profile.platform || 'Instagram',
        postData.content_type,
        postData.caption,
        JSON.stringify(postData.hashtags),
        postData.likes,
        postData.comments,
        postData.views,
        postData.reach,
        postData.engagement_rate
      ]);
      inserted.push(res.rows[0]);
    }

    res.status(201).json({
      message: '10 realistic sample posts loaded successfully',
      posts: inserted
    });
  } catch (err) {
    next(err);
  }
}

async function updateProfilePost(req, res, next) {
  try {
    const postId = req.params.id;
    const validated = profilePostSchema.partial().parse(req.body);

    const check = await query('SELECT id FROM profile_posts WHERE id = $1 AND user_id = $2', [postId, req.user.id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Post not found' });
    }

    const updates = [];
    const values = [];
    let idx = 1;

    Object.keys(validated).forEach(key => {
      if (validated[key] !== undefined) {
        if (key === 'hashtags') {
          updates.push(`${key} = $${idx}`);
          values.push(JSON.stringify(validated[key]));
        } else {
          updates.push(`${key} = $${idx}`);
          values.push(validated[key]);
        }
        idx++;
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Bad Request', message: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(postId);
    values.push(req.user.id);

    const updateQuery = `
      UPDATE profile_posts
      SET ${updates.join(', ')}
      WHERE id = $${idx} AND user_id = $${idx + 1}
      RETURNING *;
    `;

    const result = await query(updateQuery, values);
    res.json({ message: 'Post updated', post: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function deleteProfilePost(req, res, next) {
  try {
    const result = await query(
      'DELETE FROM profile_posts WHERE id = $1 AND user_id = $2 RETURNING id;',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Post not found' });
    }

    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getProfiles,
  createProfile,
  getProfileById,
  updateProfile,
  deleteProfile,
  getProfilePosts,
  createProfilePost,
  batchImportPosts,
  seedSamplePosts,
  updateProfilePost,
  deleteProfilePost
};
