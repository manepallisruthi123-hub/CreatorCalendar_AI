import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  BarChart3,
  Calendar,
  Lightbulb,
  Clock,
  RefreshCw,
  Target,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';

export function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const handleCtaClick = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  const workflowSteps = [
    { step: '01', title: 'Analyze', desc: 'Ingest your Instagram profile and recent posts data.' },
    { step: '02', title: 'Understand', desc: 'Identify format concentration, strengths, and hidden gaps.' },
    { step: '03', title: 'Improve', desc: 'Get actionable priority recommendations with evidence.' },
    { step: '04', title: 'Create', desc: 'Generate high-hook creative ideas and a 7-day strategy.' },
    { step: '05', title: 'Schedule', desc: 'Plan posting windows, regenerate posts in new tones, and track.' },
  ];

  const features = [
    {
      icon: BarChart3,
      title: 'AI Profile Analysis',
      desc: 'Heuristic indicators across consistency, content variety, brand clarity, and CTA usage—grounded in your actual posts.',
    },
    {
      icon: Lightbulb,
      title: 'Creative Content Ideas',
      desc: 'Fresh, personalized concepts with opening hooks, caption directions, and explicit gaps addressed.',
    },
    {
      icon: Clock,
      title: 'Posting Recommendations',
      desc: 'Contextual timing windows based on your historical engagement signals and audience timezone.',
    },
    {
      icon: Calendar,
      title: 'Personalized 7-Day Calendar',
      desc: 'Balanced weekly calendar spanning Reels, Carousels, and Stories with full captions and hashtags.',
    },
    {
      icon: RefreshCw,
      title: 'Individual Post Regeneration',
      desc: 'Adaptive regeneration allowing tone swaps (Funny, Witty, Authoritative) with safe preview-before-apply.',
    },
    {
      icon: Target,
      title: 'Campaign Tracking',
      desc: 'Tie weekly content calendars directly to growth objectives and monitor execution progress.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-brand-500 selection:text-white">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/25">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              CreatorCalendar <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">AI</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {isAuthenticated ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/settings')}>
                  Profile/Settings
                </Button>
                <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard')}>
                  Dashboard
                </Button>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-rose-400" onClick={logout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                  Sign In
                </Button>
                <Button variant="primary" size="sm" onClick={() => navigate('/register')}>
                  Get Started Free
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 sm:pb-24">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand-600/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <Badge variant="brand" size="md" className="mb-6">
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            Social Profile Intelligence & Content Planning
          </Badge>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-100 leading-tight">
            Turn your social profile into your <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-indigo-300 to-pink-400">content strategy.</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Analyze your existing content, discover what is working, identify what is missing, and generate a personalized content plan for your next week.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Button
              size="lg"
              variant="primary"
              icon={Sparkles}
              onClick={handleCtaClick}
            >
              Analyze My Profile
            </Button>
            <Button
              size="lg"
              variant="secondary"
              icon={ArrowRight}
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
            >
              {isAuthenticated ? 'Go to Dashboard' : 'View Live Demo'}
            </Button>
          </div>

          {/* Positioning Disclaimer */}
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Built on honest analytics. No fake follower guarantees or brittle unauthorized scraping.</span>
          </div>

          {/* Product UI Preview Mock */}
          <div className="mt-14 relative rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl p-4 sm:p-6 text-left max-w-4xl mx-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                <span className="text-xs text-slate-400 ml-2 font-mono">@demo_creator • Intelligence Overview</span>
              </div>
              <Badge variant="brand" size="sm">Planning Indicators</Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Content Consistency</span>
                <span className="text-xl font-bold text-indigo-400">72%</span>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Content Variety</span>
                <span className="text-xl font-bold text-amber-400">54%</span>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Brand Clarity</span>
                <span className="text-xl font-bold text-emerald-400">81%</span>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Caption Quality</span>
                <span className="text-xl font-bold text-sky-400">68%</span>
              </div>
            </div>

            <div className="mt-4 p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-300">
                <strong className="text-white">Profile Synthesis:</strong> Your niche appears to be <span className="text-brand-300 font-semibold">Technology Education</span>. 8 of 10 analyzed posts are carousels. Adding short-form video and interactive stories this week will unlock higher algorithmic discovery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Product Workflow Section */}
      <section className="py-16 bg-slate-900/50 border-y border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-400">Product Workflow</h2>
            <p className="text-2xl font-bold text-slate-100 mt-2">How CreatorCalendar AI Works</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {workflowSteps.map((step) => (
              <div key={step.step} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative flex flex-col justify-between">
                <div>
                  <span className="text-2xl font-black text-brand-500/30 block mb-2">{step.step}</span>
                  <h3 className="text-sm font-bold text-slate-100 mb-1.5">{step.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-400">Comprehensive Suite</h2>
            <p className="text-2xl sm:text-3xl font-bold text-slate-100 mt-2">Designed for Serious Creators</p>
            <p className="text-xs text-slate-400 mt-2">Not a generic chatbot. A dedicated social media intelligence workspace.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feat) => {
              const Icon = feat.icon;
              return (
                <div key={feat.title} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition-all flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-100 mb-2">{feat.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 bg-gradient-to-b from-slate-900 to-slate-950 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-100">Ready to level up your social strategy?</h2>
          <p className="mt-3 text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Connect your profile or import sample data to unlock AI-powered insights and a customized 7-day content plan in minutes.
          </p>
          <div className="mt-6">
            <Button size="lg" variant="primary" icon={Sparkles} onClick={handleCtaClick}>
              Start Analyzing Now
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-slate-800/80 bg-slate-950 text-center text-xs text-slate-400">
        <p>© 2026 CreatorCalendar AI. Turn your social profile into your content strategy.</p>
      </footer>
    </div>
  );
}

export default Landing;
