const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { initDb } = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const profilePostRoutes = require('./routes/profilePost.routes');
const analysisRoutes = require('./routes/analysis.routes');
const recommendationRoutes = require('./routes/recommendation.routes');
const ideaRoutes = require('./routes/idea.routes');
const contentPlanRoutes = require('./routes/contentPlan.routes');
const postRoutes = require('./routes/post.routes');
const campaignRoutes = require('./routes/campaign.routes');
const aiRoutes = require('./routes/ai.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl/Postman)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Allow during local development
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use('/api', generalLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'CreatorCalendar AI Server',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/profile-posts', profilePostRoutes);
app.use('/api/profiles', analysisRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/profiles', ideaRoutes);
app.use('/api/ideas', ideaRoutes);
app.use('/api/content-plans', contentPlanRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Serve client static build if present
const clientDist = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(clientDist, 'index.html'));
    }
    next();
  });
}

// Global Error Handler
app.use(errorHandler);

// Start server after DB initialization
async function startServer() {
  try {
    await initDb();
    const server = app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`🚀 CreatorCalendar AI Server running on port ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
      console.log(`===============================================`);
    });
    return server;
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
