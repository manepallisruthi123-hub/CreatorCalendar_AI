import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Spinner } from '../components/common/Spinner';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { useToast } from '../components/common/Toast';
import {
  Sparkles,
  Lightbulb,
  Calendar,
  Plus,
  RefreshCw,
  Target,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Clock,
  Layers,
  Award,
  ChevronRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { InstagramIcon } from '../components/common/InstagramIcon';

export function Dashboard() {
  const navigate = useNavigate();
  const { activeProfile, refreshProfiles } = useAuth();
  const toast = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, [activeProfile?.id]);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.dashboard.getSummary(activeProfile?.id);
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Spinner size="lg" />
        <p className="text-xs text-slate-400">Loading intelligence dashboard...</p>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchDashboard} />;
  }

  if (!data?.has_profile) {
    return (
      <EmptyState
        icon={InstagramIcon}
        title="No Social Profile Connected"
        description="Create your creator profile to unlock evidence-based AI feedback, creative ideas, and a 7-day content calendar."
        actionLabel="Create Profile & Get Feedback"
        actionIcon={Plus}
        onAction={() => navigate('/profiles/new')}
      />
    );
  }

  const profile = data.active_profile;
  const scoreData = data.profile_score || { score: 75, confidence: 'LOW' };
  const platforms = data.connected_platforms || [];
  const topRecommendations = data.top_improvement_areas || [];
  const upcomingPosts = data.upcoming_calendar_items || [];
  const recentIdeas = data.recent_creative_ideas || [];
  const campaigns = data.campaigns_overview || [];

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto">
      {/* Header Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-950/60 via-slate-900 to-indigo-950/40 border border-brand-500/20 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-100">
              Welcome, @{profile.username}
            </h1>
            <Badge variant="brand" size="sm">{profile.niche || 'Creator'}</Badge>
          </div>
          <p className="text-xs text-slate-300">
            Goal: <strong className="text-white">{profile.content_goal || 'Growth'}</strong> •
            Tone: <strong className="text-white">{profile.preferred_tone || 'Authentic'}</strong> •
            Timezone: <strong className="text-brand-300">{profile.timezone || 'Asia/Kolkata'}</strong>
          </p>
          <p className="text-[11px] text-slate-400">
            {data.data_status?.message || 'Strategy generated from your profile positioning.'}
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            size="sm"
            variant="secondary"
            icon={Sparkles}
            onClick={() => navigate('/feedback')}
          >
            View Feedback
          </Button>

          <Button
            size="sm"
            variant="outline"
            icon={Lightbulb}
            onClick={() => navigate('/ideas')}
          >
            Creative Ideas
          </Button>

          <Button
            size="sm"
            variant="primary"
            icon={Calendar}
            onClick={() => navigate('/calendar')}
          >
            7-Day Calendar
          </Button>
        </div>
      </div>

      {/* Overview Top Row: Profile Score & Connected Platforms */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Score Card */}
        <div className="md:col-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
                Profile Planning Score
              </span>
              <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded border ${
                scoreData.confidence === 'HIGH'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : (scoreData.confidence === 'MEDIUM'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300')
              }`}>
                {scoreData.confidence} Confidence
              </span>
            </div>

            <div className="flex items-baseline gap-2 my-3">
              <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-pink-300">
                {scoreData.score}
              </span>
              <span className="text-base font-semibold text-slate-500">/ 100</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {data.feedback_summary || 'Your profile has a defined direction ready for execution.'}
            </p>
          </div>

          <Button
            size="sm"
            variant="secondary"
            icon={ArrowRight}
            className="w-full justify-between"
            onClick={() => navigate('/feedback')}
          >
            <span>Detailed Breakdown</span>
          </Button>
        </div>

        {/* Connected Platforms Overview */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-400" />
                Multi-Platform Connection Status
              </h3>
              <p className="text-[11px] text-slate-400">
                Official API integrations only. Unconfigured channels remain safely transparent.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
            {['instagram', 'youtube', 'tiktok', 'linkedin', 'facebook'].map((platKey) => {
              const item = platforms.find(p => p.platform === platKey) || {
                platform: platKey,
                displayName: platKey.charAt(0).toUpperCase() + platKey.slice(1),
                connected: false,
                status: 'NOT_CONFIGURED'
              };
              const isConn = item.connected;

              return (
                <div
                  key={platKey}
                  className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between space-y-2 text-center"
                >
                  <span className="text-xs font-bold text-slate-200 capitalize">{platKey}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                    isConn
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                      : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                  }`}>
                    {isConn ? 'Connected' : 'Not Connected'}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Profile intelligence works immediately with or without active social API connections.</span>
          </div>
        </div>
      </div>

      {/* Top Improvement Recommendations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-slate-100">Top Improvement Priorities</h2>
          </div>
          <button
            onClick={() => navigate('/feedback')}
            className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1"
          >
            All Feedback <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topRecommendations.slice(0, 3).map((rec, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-slate-100 truncate">{rec.title}</span>
                  <span className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded border ${
                    rec.priority === 'HIGH'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  }`}>
                    {rec.priority || 'MEDIUM'}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                  {rec.action || rec.recommendation || rec.description}
                </p>
              </div>

              {rec.suggested_frequency && (
                <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-brand-400" />
                  <span>Cadence: {rec.suggested_frequency}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming 7-Day Calendar Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-slate-100">Upcoming 7-Day Calendar</h2>
          </div>
          <Button
            size="sm"
            variant="ghost"
            icon={ArrowRight}
            onClick={() => navigate('/calendar')}
          >
            Manage Calendar
          </Button>
        </div>

        {upcomingPosts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {upcomingPosts.slice(0, 4).map((post) => (
              <div
                key={post.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex flex-col justify-between space-y-3 hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-semibold text-slate-400">{post.scheduled_date || 'Upcoming'}</span>
                    <Badge variant="brand" size="sm">{post.content_type || 'Post'}</Badge>
                  </div>

                  <h4 className="text-xs font-bold text-slate-100 line-clamp-2">{post.topic}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 italic">"{post.hook}"</p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 font-mono">
                    {post.suggested_time ? `${post.suggested_time} (${profile.timezone || 'Asia/Kolkata'})` : 'Window'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-300 font-semibold border border-brand-500/20">
                    {post.status || 'DRAFT'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 text-center space-y-2">
            <p className="text-xs text-slate-400">No content scheduled for this week yet.</p>
            <Button
              size="sm"
              variant="primary"
              icon={Calendar}
              onClick={() => navigate('/calendar')}
            >
              Generate 7-Day Calendar
            </Button>
          </div>
        )}
      </div>

      {/* Recent Creative Ideas & Campaigns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Creative Ideas Snippet */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-slate-100">Recent Creative Ideas</h3>
            </div>
            <button
              onClick={() => navigate('/ideas')}
              className="text-xs text-brand-400 hover:text-brand-300 font-medium"
            >
              View All
            </button>
          </div>

          {recentIdeas.length > 0 ? (
            <div className="space-y-2.5">
              {recentIdeas.slice(0, 3).map((idea) => (
                <div
                  key={idea.id}
                  className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-200 block truncate max-w-[280px]">
                      {idea.title}
                    </span>
                    <p className="text-[11px] text-slate-400 truncate max-w-[280px]">
                      {idea.concept}
                    </p>
                  </div>
                  <Badge variant="indigo" size="sm">{idea.format}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 space-y-2">
              <p className="text-xs text-slate-400">Generate creative ideas from your profile feedback.</p>
              <Button size="sm" variant="outline" onClick={() => navigate('/ideas')}>
                Generate Ideas
              </Button>
            </div>
          )}
        </div>

        {/* Campaign Overview */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-100">Campaign Planning</h3>
            </div>
            <button
              onClick={() => navigate('/campaigns')}
              className="text-xs text-brand-400 hover:text-brand-300 font-medium"
            >
              View Campaigns
            </button>
          </div>

          {campaigns.length > 0 ? (
            <div className="space-y-2.5">
              {campaigns.slice(0, 3).map((camp) => (
                <div
                  key={camp.id}
                  className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">{camp.name}</span>
                    <span className="text-[10px] text-slate-400">{camp.goal || 'Brand Growth'}</span>
                  </div>
                  <Badge variant="brand" size="sm">{camp.status}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 space-y-2">
              <p className="text-xs text-slate-400">Organize your weekly calendar items into targeted campaigns.</p>
              <Button size="sm" variant="outline" onClick={() => navigate('/campaigns')}>
                Create Campaign
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
