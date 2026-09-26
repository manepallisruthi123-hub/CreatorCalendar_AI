import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Spinner } from '../components/common/Spinner';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { ContentMixChart, ThemeChart, PostingWindowCard } from '../components/profiles/ProfileComponents';
import { useToast } from '../components/common/Toast';
import {
  Sparkles,
  Lightbulb,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  BarChart2,
  ShieldCheck,
  Target,
  FileText
} from 'lucide-react';
import { InstagramIcon } from '../components/common/InstagramIcon';

export function ProfileAnalysis() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeProfile, profiles, selectProfile } = useAuth();
  const toast = useToast();

  const profileId = id || activeProfile?.id;

  const [analysis, setAnalysis] = useState(null);
  const [profile, setProfile] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (profileId) {
      loadAnalysisData(profileId);
    } else if (profiles && profiles.length > 0) {
      loadAnalysisData(profiles[0].id);
    } else {
      setLoading(false);
    }
  }, [profileId, profiles]);

  const loadAnalysisData = async (pId) => {
    setLoading(true);
    setError(null);
    try {
      const pRes = await api.profiles.get(pId);
      setProfile(pRes.profile);
      selectProfile(pRes.profile);

      try {
        const aRes = await api.analysis.getLatest(pId);
        setAnalysis(aRes.analysis);
      } catch (err) {
        // Not analyzed yet
        setAnalysis(null);
      }

      try {
        const rRes = await api.analysis.getRecommendations(pId);
        setRecommendations(rRes.recommendations || []);
      } catch (err) {
        setRecommendations([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load profile analysis');
    } finally {
      setLoading(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (!profileId) return;
    setAnalyzing(true);
    try {
      const res = await api.analysis.trigger(profileId);
      setAnalysis(res.analysis);
      toast.success(
        res.analysis?.analysis_mode === 'STARTER_STRATEGY'
          ? 'Starter Content Strategy generated!'
          : 'Content analysis completed successfully!'
      );
      const rRes = await api.analysis.getRecommendations(profileId);
      setRecommendations(rRes.recommendations || []);
    } catch (err) {
      toast.error(err.message || "AI analysis couldn't be completed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleUpdateRecStatus = async (recId, newStatus) => {
    try {
      await api.analysis.updateRecommendation(recId, newStatus);
      toast.success(`Recommendation status: ${newStatus}`);
      setRecommendations(recs =>
        recs.map(r => r.id === recId ? { ...r, status: newStatus } : r)
      );
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Spinner size="lg" />
        <p className="text-xs text-slate-400">Loading intelligence analysis...</p>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => loadAnalysisData(profileId)} />;
  }

  if (!profile) {
    return (
      <EmptyState
        icon={InstagramIcon}
        title="No Profile Selected"
        description="Select or create a social profile to review its AI analysis report."
        actionLabel="Go to Profiles"
        onAction={() => navigate('/profiles')}
      />
    );
  }

  const postCount = parseInt(profile.post_count, 10) || 0;
  const initialButtonLabel = postCount === 0
    ? 'Create Starter Strategy'
    : (postCount === 1 ? 'Analyze 1 Post' : `Analyze ${postCount} Posts`);

  const reanalyzeButtonLabel = postCount === 0
    ? 'Re-Generate Strategy'
    : (postCount === 1 ? 'Re-Analyze 1 Post' : `Re-Analyze ${postCount} Posts`);

  if (!analysis) {
    return (
      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center justify-center mx-auto">
            <Sparkles className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            {postCount === 0 ? 'Create Starter Strategy for @' : 'Ready to Analyze @'}{profile.username}
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {postCount === 0
              ? 'Starting fresh with no historical posts. CreatorCalendar AI will synthesize a foundational content strategy, core pillars, and starter schedule based on your profile niche and audience.'
              : `CreatorCalendar AI will examine your ${postCount} stored post(s), caption hooks, consistency, and calls-to-action to synthesize your content strategy.`}
          </p>
          <div className="pt-2">
            <Button
              size="md"
              variant="primary"
              icon={Sparkles}
              onClick={handleRunAnalysis}
              loading={analyzing}
            >
              {initialButtonLabel}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isStarter = analysis.analysis_mode === 'STARTER_STRATEGY';
  const isEarly = analysis.analysis_mode === 'EARLY_CONTENT';

  const reportTitle = isStarter
    ? `Starter Content Strategy`
    : (isEarly ? `Early Content Analysis` : `Profile Content Analysis`);

  const modeBadgeText = isStarter
    ? 'Starter Content Strategy (0 Posts)'
    : (isEarly ? 'Early Content Analysis (Limited Data)' : 'Profile Content Analysis');

  return (
    <div className="space-y-6">
      {/* Overview Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-black text-slate-100">
              @{profile.username} — {reportTitle}
            </h1>
            <Badge variant={isStarter ? 'brand' : (isEarly ? 'warning' : 'success')} size="sm">
              {modeBadgeText}
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {analysis.profile_summary?.positioning || 'AI-powered content intelligence summary.'}
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            variant="secondary"
            icon={RefreshCw}
            onClick={handleRunAnalysis}
            loading={analyzing}
          >
            {reanalyzeButtonLabel}
          </Button>

          <Button
            size="sm"
            variant="outline"
            icon={Sparkles}
            onClick={() => navigate('/ideas')}
          >
            Generate My Next Posts
          </Button>

          <Button
            size="sm"
            variant="primary"
            icon={Calendar}
            onClick={() => navigate('/calendar')}
          >
            Generate 7-Day Plan
          </Button>
        </div>
      </div>

      {/* Notice for 1-2 Posts */}
      {isEarly && (
        <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 text-xs text-indigo-300 flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold text-slate-200">Limited historical data:</strong> Analysis is grounded strictly in your {postCount} published post(s). Consistency and long-term variety patterns cannot be evaluated until more content is published.
          </div>
        </div>
      )}

      {/* Profile Overview & Health Indicators (Nullable, No Fake Numbers) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 block font-medium">Content Consistency</span>
          <span className="text-2xl font-bold text-indigo-400 mt-1 block">
            {analysis.consistency?.indicator !== null && analysis.consistency?.indicator !== undefined
              ? `${analysis.consistency.indicator}%`
              : '—'}
          </span>
          <p className="text-[10px] text-slate-400 mt-1 line-clamp-3">
            {analysis.consistency?.explanation || 'No historical posting rhythm recorded.'}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 block font-medium">Content Variety</span>
          <span className="text-2xl font-bold text-amber-400 mt-1 block">
            {analysis.content_variety?.indicator !== null && analysis.content_variety?.indicator !== undefined
              ? `${analysis.content_variety.indicator}%`
              : '—'}
          </span>
          <p className="text-[10px] text-slate-400 mt-1 line-clamp-3">
            {analysis.content_variety?.explanation || 'Format diversity across posts.'}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 block font-medium">Caption Quality</span>
          <span className="text-2xl font-bold text-sky-400 mt-1 block">
            {analysis.caption_quality?.indicator !== null && analysis.caption_quality?.indicator !== undefined
              ? `${analysis.caption_quality.indicator}%`
              : '—'}
          </span>
          <p className="text-[10px] text-slate-400 mt-1 line-clamp-3">
            {analysis.caption_quality?.explanation || 'Evaluation of opening hook and copy structure.'}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 block font-medium">CTA Usage</span>
          <span className="text-2xl font-bold text-rose-400 mt-1 block">
            {analysis.cta_usage?.indicator !== null && analysis.cta_usage?.indicator !== undefined
              ? `${analysis.cta_usage.indicator}%`
              : '—'}
          </span>
          <p className="text-[10px] text-slate-400 mt-1 line-clamp-3">
            {analysis.cta_usage?.explanation || 'Presence of audience interaction prompts.'}
          </p>
        </div>
      </div>

      {/* Content Mix & Themes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ContentMixChart mix={analysis.content_mix || []} />
        <ThemeChart themes={analysis.content_themes || []} />
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Strengths */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                {isStarter ? 'Foundational Strengths' : 'Proven Strengths'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isStarter ? 'Core strategic assets from your profile' : 'What your published content executes well'}
              </p>
            </div>
          </div>

          <div className="space-y-3.5">
            {analysis.strengths?.map((s, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800">
                <h4 className="text-xs font-bold text-emerald-300">{s.title}</h4>
                <p className="text-xs text-slate-300 mt-1">{s.description}</p>
                {s.evidence && (
                  <p className="text-[11px] text-slate-400 mt-1.5 font-mono">
                    Evidence: {s.evidence}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Weaknesses */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                {isStarter ? 'Baseline Realities' : 'Content Bottlenecks & Gaps'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isStarter ? 'Factors to account for as you publish post #1' : 'Identified gaps holding back discovery'}
              </p>
            </div>
          </div>

          <div className="space-y-3.5">
            {analysis.weaknesses?.map((w, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800">
                <h4 className="text-xs font-bold text-amber-300">{w.title}</h4>
                <p className="text-xs text-slate-300 mt-1">{w.description}</p>
                {w.evidence && (
                  <p className="text-[11px] text-slate-400 mt-1.5 font-mono">
                    Evidence: {w.evidence}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Strategic Opportunities */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Growth Opportunities</h3>
            <p className="text-[11px] text-slate-400">Actionable angles to capture overlooked audience interest</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {analysis.opportunities?.map((opp, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={opp.priority === 'HIGH' ? 'danger' : 'brand'} size="sm">
                    {opp.priority} PRIORITY
                  </Badge>
                </div>
                <h4 className="text-xs font-bold text-slate-100">{opp.title}</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{opp.description}</p>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-800/80">
                <span className="text-[10px] font-bold uppercase text-brand-400 block">Suggested Action</span>
                <p className="text-xs text-slate-200 mt-0.5">{opp.action}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Next Posts (Part 8 & 9) */}
      {analysis.recommended_next_posts && analysis.recommended_next_posts.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Recommended Next Posts</h3>
                <p className="text-[11px] text-slate-400">Personalized content concepts tailored to your profile goals</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              icon={Lightbulb}
              onClick={() => navigate('/ideas')}
            >
              Generate My Next Posts
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analysis.recommended_next_posts.slice(0, 6).map((post, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="brand" size="sm">{post.format || 'Post'}</Badge>
                  </div>
                  <h4 className="text-xs font-bold text-slate-100">{post.title}</h4>
                  {post.hook && (
                    <p className="text-[11px] text-brand-300 mt-1.5 italic">
                      "{post.hook}"
                    </p>
                  )}
                  {post.concept && (
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {post.concept}
                    </p>
                  )}
                </div>
                {post.cta && (
                  <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
                    <strong className="text-slate-300">CTA:</strong> {post.cta}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actionable Recommendations with Status */}
      {recommendations.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-sm font-bold text-slate-100 mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-brand-400" />
            Prioritized Action Recommendations
          </h3>

          <div className="space-y-3">
            {recommendations.map((rec) => (
              <div key={rec.id} className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={rec.priority === 'HIGH' ? 'danger' : 'warning'} size="sm">
                      {rec.priority}
                    </Badge>
                    <h4 className="text-xs font-bold text-slate-200">{rec.title}</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{rec.description}</p>
                  <p className="text-[11px] text-brand-300 mt-1 font-medium">Action: {rec.action}</p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <select
                    value={rec.status}
                    onChange={(e) => handleUpdateRecStatus(rec.id, e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="DISMISSED">Dismissed</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Posting Windows */}
      <PostingWindowCard windows={analysis.posting_windows || []} />
    </div>
  );
}
