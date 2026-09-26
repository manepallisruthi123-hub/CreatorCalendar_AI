import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  ProfileHealthCard,
  StatCard,
  StrengthCard,
  WeaknessCard,
  OpportunityCard,
  RecommendationCard,
  UpcomingPosts
} from '../components/dashboard';
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
  FileText,
  Target,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { InstagramIcon } from '../components/common/InstagramIcon';

export function Dashboard() {
  const navigate = useNavigate();
  const { activeProfile, refreshProfiles } = useAuth();
  const toast = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

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

  const handleQuickAnalyze = async () => {
    if (!activeProfile?.id) return;
    setAnalyzing(true);
    try {
      await api.analysis.trigger(activeProfile.id);
      toast.success('Profile analysis updated!');
      await fetchDashboard();
    } catch (err) {
      toast.error(err.message || 'Failed to run analysis');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRecommendationStatus = async (recId, newStatus) => {
    try {
      await api.analysis.updateRecommendation(recId, newStatus);
      toast.success(`Recommendation marked as ${newStatus}`);
      fetchDashboard();
    } catch (err) {
      toast.error(err.message || 'Failed to update recommendation');
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
        description="Connect your Instagram profile or import sample post data to generate your personalized content strategy and calendar."
        actionLabel="Add Your First Profile"
        actionIcon={Plus}
        onAction={() => navigate('/profiles/new')}
      />
    );
  }

  const hasAnalysis = data?.profile_health?.is_analyzed;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brand-900/40 via-slate-900 to-indigo-950/40 border border-brand-500/20 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-100">
              Welcome back, @{data.active_profile.username}
            </h1>
            <Badge variant="brand" size="sm">{data.active_profile.niche || 'Creator'}</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Goal: <strong className="text-slate-300">{data.active_profile.content_goal || 'Growth'}</strong> •
            Tone: <strong className="text-slate-300">{data.active_profile.preferred_tone || 'Engaging'}</strong> •
            Analyzed Posts: <strong className="text-brand-300">{data.analyzed_posts_count} posts</strong>
          </p>
        </div>

        {/* Quick Strategy Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            variant="secondary"
            icon={RefreshCw}
            onClick={handleQuickAnalyze}
            loading={analyzing}
          >
            {hasAnalysis ? 'Re-Analyze Profile' : 'Run Profile Analysis'}
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
            7-Day Plan
          </Button>
        </div>
      </div>

      {/* Heuristic Health Card */}
      <ProfileHealthCard health={data.profile_health} />

      {/* Stats Counter Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Analyzed Posts"
          value={data.analyzed_posts_count}
          subtitle="Recent post corpus"
          icon={FileText}
          color="brand"
        />
        <StatCard
          title="Scheduled Posts"
          value={data.post_stats?.SCHEDULED || 0}
          subtitle="Ready to publish"
          icon={Calendar}
          color="emerald"
        />
        <StatCard
          title="Draft Ideas"
          value={data.post_stats?.DRAFT || 0}
          subtitle="In calendar pipeline"
          icon={Lightbulb}
          color="amber"
        />
        <StatCard
          title="Active Campaigns"
          value={data.active_campaigns?.length || 0}
          subtitle="Growth initiatives"
          icon={Target}
          color="sky"
        />
      </div>

      {/* 3 Pillars Grid: What's Working, What Could Improve, Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <StrengthCard strengths={data.whats_working} />
        <WeaknessCard weaknesses={data.what_could_improve} />
        <OpportunityCard opportunities={data.opportunities} />
      </div>

      {/* Bottom Grid: Top Recommendations & Upcoming Posts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <RecommendationCard
          recommendations={data.recommendations}
          onStatusChange={handleRecommendationStatus}
        />
        <UpcomingPosts posts={data.upcoming_posts} />
      </div>
    </div>
  );
}

export default Dashboard;
