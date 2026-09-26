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
  CheckCircle2,
  Layers,
  Award
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';

export function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const handleAnalyzeProfileClick = () => {
    if (isAuthenticated) {
      navigate('/profiles/new');
    } else {
      navigate('/register');
    }
  };

  const workflowSteps = [
    { step: '01', title: 'Analyze', desc: "Analyze available creator profile and verified social data." },
    { step: '02', title: 'Understand', desc: 'Identify format positioning, strengths, and hidden gaps.' },
    { step: '03', title: 'Improve', desc: 'Get actionable priority recommendations with evidence.' },
    { step: '04', title: 'Create', desc: 'Generate platform-adapted creative ideas and hook angles.' },
    { step: '05', title: 'Schedule', desc: 'Build a personalized 7-day content calendar and campaign plan.' },
  ];

  const features = [
    {
      icon: Award,
      title: 'AI Profile Feedback',
      desc: 'Evidence-based profile evaluation with an objective Score /100, confidence levels, and clarity diagnostics.',
    },
    {
      icon: Target,
      title: 'Improvement Recommendations',
      desc: 'Actionable suggestions with current state analysis, explicit evidence, and recommended weekly cadence.',
    },
    {
      icon: Lightbulb,
      title: 'Creative Content Ideas',
      desc: 'Fresh, platform-adapted concepts with opening hooks, caption directions, and specific content gaps resolved.',
    },
    {
      icon: Clock,
      title: 'Posting Recommendations',
      desc: 'Recommended posting windows grounded in your audience timezone and active platform behaviors.',
    },
    {
      icon: Calendar,
      title: 'Personalized 7-Day Calendar',
      desc: 'Balanced weekly calendar spanning multi-platform formats, complete hooks, captions, and call-to-actions.',
    },
    {
      icon: Layers,
      title: 'Campaign Planning',
      desc: 'Organize planned weekly themes, calendar items, and growth objectives into cohesive initiatives.',
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
                  Settings
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

          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">
            CreatorCalendar AI analyzes the creator's available profile and social data, identifies strengths, weaknesses, content gaps, and improvement opportunities, then turns those insights into creative ideas and a personalized 7-day content calendar.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Button
              size="lg"
              variant="primary"
              icon={Sparkles}
              onClick={handleAnalyzeProfileClick}
            >
              Analyze My Profile
            </Button>
            <Button
              size="lg"
              variant="secondary"
              icon={ArrowRight}
              onClick={() => navigate(isAuthenticated ? '/feedback' : '/login')}
            >
              View Live Demo
            </Button>
          </div>

          {/* Positioning Disclaimer */}
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Built on honest profile intelligence. Works with 0 historical posts. No fake metrics.</span>
          </div>

          {/* Product UI Preview Mock */}
          <div className="mt-14 relative rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl p-5 sm:p-7 text-left max-w-4xl mx-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                <span className="text-xs text-slate-400 ml-2 font-mono">@priyatech • Profile Feedback</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="brand" size="sm">Medium Confidence</Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-5">
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
                <span className="text-[11px] text-slate-400 block font-semibold uppercase">Profile Score</span>
                <div className="flex items-baseline gap-1 my-1">
                  <span className="text-3xl font-extrabold text-brand-300">78</span>
                  <span className="text-xs text-slate-500">/ 100</span>
                </div>
                <span className="text-[10px] text-slate-400">AI-generated planning score</span>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
                <span className="text-[11px] text-slate-400 block font-semibold uppercase">Key Strength</span>
                <span className="text-xs font-bold text-emerald-400 mt-1">Disciplined Tech Niche</span>
                <p className="text-[10px] text-slate-400 mt-1">Clear focus in Full-Stack Engineering & Web3.</p>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
                <span className="text-[11px] text-slate-400 block font-semibold uppercase">Top Improvement</span>
                <span className="text-xs font-bold text-amber-400 mt-1">Content Variety</span>
                <p className="text-[10px] text-slate-400 mt-1">Introduce short-form video breakdowns (2x/week).</p>
              </div>
            </div>

            <div className="mt-4 p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-300">
                <strong className="text-white">Profile Synthesis:</strong> Your niche is clearly defined for aspiring developers. We identified an opportunity to bridge technical carousels with short video hooks and clear calls-to-action to accelerate audience engagement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Product Workflow Section */}
      <section className="py-16 bg-slate-900/50 border-y border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-100">
              The 5-Step Creator Journey
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              From profile positioning to structured execution without manual friction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {workflowSteps.map((step) => (
              <div
                key={step.step}
                className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl relative flex flex-col justify-between"
              >
                <div>
                  <span className="text-xs font-mono font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-md">
                    {step.step}
                  </span>
                  <h3 className="text-sm font-bold text-slate-100 mt-3">{step.title}</h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <Badge variant="indigo" size="md" className="mb-3">
            Core Platform Capabilities
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100">
            Strategy Grounded in Reality
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-xl mx-auto">
            Everything you need to turn your profile into high-performing creative content and a reliable weekly schedule.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-brand-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-100">{feature.title}</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="border-t border-slate-800 bg-slate-950 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-brand-600 flex items-center justify-center text-white text-xs">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-slate-300">CreatorCalendar AI</span>
            <span className="text-[10px] text-slate-500">© 2026. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>Built for Creators</span>
            <span>•</span>
            <span>Honest Intelligence</span>
            <span>•</span>
            <button onClick={() => navigate('/login')} className="hover:text-slate-200">
              Sign In
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
