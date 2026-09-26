# CreatorCalendar AI

> **"Turn your social profile into your content strategy."**

CreatorCalendar AI is a full-stack, AI-powered social media profile intelligence and content planning platform. It bridges the gap between raw profile history and actionable content planning by diagnosing your current content performance, detecting format concentration and engagement gaps, and synthesizing a personalized, high-retention 7-day content calendar.

---

## 🌟 Key Features

1. **Social Profile Intelligence & Health Indicators**
   - AI-derived heuristic indicators: Content Consistency, Content Variety, Brand Clarity, Caption Quality, CTA Usage, and Format Mix.
   - Grounded in your actual posts with clear disclaimers (not fake vanity metrics).

2. **Ethical Profile Data Ingestion Abstraction**
   - **Zero Unauthorized Scraping Policy:** Protects creator credentials and respects platform terms.
   - Ingestion Modes:
     - **Mode A:** Profile URL & metadata (niche, target audience, tone, goals).
     - **Mode B:** Manual post corpus entry.
     - **Mode C:** 1-Click Realistic Creator Post Seeder (10 balanced posts across Carousels, Reels, and Stories).
     - **Mode D:** CSV analytics batch import.

3. **In-Depth Profile Diagnosis**
   - Proven Strengths with evidence from your captions.
   - Content Bottlenecks & Gaps (e.g. format over-reliance, missing CTAs).
   - Strategic Growth Opportunities with actionable priorities (HIGH, MEDIUM, LOW).
   - Dynamic Recommendation Tracking (Pending, In Progress, Completed, Dismissed).

4. **Contextual Posting Windows**
   - Calculated planning windows tailored to your historical engagement data and audience timezone.
   - Clear confidence levels and explicit uncertainty transparency.

5. **AI Creative Idea Generator**
   - Generates 5–10 personalized content concepts.
   - Includes opening hooks, format recommendations, caption direction, and the specific profile gap addressed.
   - 1-click scheduling into calendar drafts.

6. **7-Day Cohesive Content Calendar**
   - Strategic campaign theme and foundational content pillars.
   - Day-by-day balanced publishing plan spanning Reels, Carousels, Stories, and Static Posts.
   - Complete ready-to-post captions with hooks, hashtags, and call-to-actions.

7. **Adaptive Single-Post Regeneration**
   - Regenerate any individual post with a new tone (Funny & Relatable, Witty, Authoritative, Inspirational, Casual).
   - **Safe Preview Workflow:** Generates a replacement preview first; user explicitly clicks "Apply New Version" to commit.

8. **Content Lifecycle & Pipeline Tracking**
   - Filter and manage posts by Status (`DRAFT`, `SCHEDULED`, `PUBLISHED`, `ARCHIVED`), Format, and Keyword Search.

---

## 🛠 Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS, Lucide Icons, React Router 7.
- **Backend:** Node.js, Express, Helmet, CORS, Express Rate Limit.
- **Database:** PostgreSQL (with unified support for external PostgreSQL via `DATABASE_URL` and persistent zero-dependency WebAssembly PostgreSQL via `@electric-sql/pglite`).
- **AI Integration:** `@google/genai` (Gemini 2.5 Flash / Gemini 1.5 Flash) with fallback heuristic intelligence engine.
- **Validation:** Zod schemas for all client inputs and AI structured JSON responses.
- **Security:** bcrypt password hashing, stateless JWT authentication, and strict row-level ownership isolation (`WHERE user_id = $userId`).

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js:** v18 or higher (v24 recommended)
- **npm:** v9 or higher

### 2. Installation
Clone the repository and install all dependencies:

```bash
cd creator-calendar-ai
npm run install:all
```

### 3. Environment Configuration
Create a `.env` file inside `server/` (or copy `.env.example`):

```bash
cp .env.example server/.env
```

Default configuration in `server/.env`:
```env
PORT=5000
DATABASE_URL=
JWT_SECRET=creator_calendar_jwt_secret_secure_key_987654321
GEMINI_API_KEY=your_gemini_api_key_here
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

> **Note on Database:** If `DATABASE_URL` is empty, CreatorCalendar AI automatically uses embedded persistent PostgreSQL (`@electric-sql/pglite`) in `server/data/pgdata`. If you have a live PostgreSQL database (Neon, Supabase, RDS, local pg), simply set `DATABASE_URL=postgresql://user:pass@host:5432/dbname`.

> **Note on Gemini API:** If `GEMINI_API_KEY` is provided, the platform uses Google's latest Gemini models via `@google/genai`. If no key is set or during offline evaluation, the built-in deterministic heuristic engine operates seamlessly.

### 4. Running the Application

#### Option A: Running Development Servers (Recommended)
In separate terminal windows:

Terminal 1 (Backend):
```bash
cd server
npm start
```
*Backend runs on `http://localhost:5000`*

Terminal 2 (Frontend):
```bash
cd client
npm run dev
```
*Frontend runs on `http://localhost:5173`*

#### Option B: Unified Production Server
Build the frontend and run everything from the Express backend on port 5000:
```bash
npm run build
npm start
```
*Open `http://localhost:5000` in your browser.*

---

## 🎬 2-Minute Demo Story Walkthrough

Follow this exact story to evaluate the application:

1. **Sign In / Registration:**
   - Go to `http://localhost:5173/login`.
   - Click **"1-Click Demo Login"** (or register an account).

2. **Connect Profile:**
   - Navigate to **Profiles** → **Add Social Profile**.
   - Click **"Fill Demo Preset"** to populate:
     - Platform: `Instagram`
     - Username: `demo_creator`
     - Niche: `Technology`
     - Audience: `College students`
     - Goal: `Engagement`
     - Tone: `Friendly`
   - Click **"Create & Proceed to Post Ingestion"**.

3. **Ingest Post Corpus:**
   - Notice the Ingestion Status notice explaining the zero unauthorized scraping policy.
   - Click **"Load 10 Realistic Creator Posts"**.
   - 10 structured posts appear in the corpus table with captions, likes, comments, and hashtags.

4. **Analyze Profile:**
   - Click **"Analyze Profile (10 Posts)"**.
   - Review the **Intelligence Report**:
     - Heuristic Indicators: Content Consistency (72%), Content Variety (54%), Caption Quality (68%), CTA Usage (61%).
     - Format Mix Chart & Thematic Topic Distribution.
     - Proven Strengths & Bottlenecks.
     - Recommended Posting Windows with confidence indicators.

5. **Generate Creative Ideas:**
   - Click **"Generate Ideas"** (or visit `/ideas`).
   - Review 6+ personalized concepts tailored to address format concentration with opening hooks and effort badges.
   - Click **"Schedule"** on any idea to move it into calendar drafts.

6. **Generate 7-Day Plan:**
   - Click **"7-Day Plan"** (or visit `/calendar`).
   - Click **"Generate 7-Day Plan"**.
   - Review the active campaign strategy theme and content pillars.
   - Inspect the Monday–Sunday schedule with Reels, Carousels, Stories, hooks, captions, and suggested times.

7. **Individual Post Regeneration:**
   - Click the Sparkles icon on any post card (e.g. Wednesday or Friday).
   - Choose Tone: **"Funny & Relatable"** (or **"Witty & Sharp"**).
   - Click **"Generate Replacement Preview"**.
   - Notice the preview appears with the new humor-infused hook and caption while preserving the niche and date.
   - Click **"Apply New Version"**.
   - Change the post status to **"SCHEDULED"**.

8. **Review Updated Dashboard:**
   - Click **Dashboard**.
   - Observe real-time dynamic statistics: scheduled posts counter, upcoming post cards, and campaign progress.

---

## 🔒 Security & Data Isolation Architecture

- **Stateless JWTs:** Tokens verified on all `/api/*` protected endpoints.
- **Strict Row-Level Isolation:** All database queries require `WHERE user_id = $authenticatedUserId`. No user can access or modify another user's profile, posts, or calendar.
- **Parameterized SQL:** All queries are parameterized, preventing SQL injection.
- **Zero API Key Leakage:** `GEMINI_API_KEY` is exclusively accessed server-side. No `VITE_` prefixed keys exist in the frontend.
- **Zod Validation:** Every input body and every AI response is strictly validated against explicit Zod schemas.

---

## 📄 License
MIT License. Built for Creators with CreatorCalendar AI.
