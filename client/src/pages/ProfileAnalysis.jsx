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
      toast.success('Analysis generated successfully!');
      const rRes = await api.analysis.getRecommendations(profileId);
      setRecommendations(rRes.recommendations || []);
    } catch (err) {
      toast.error(err.message || 'Analysis failed. Make sure recent posts are added.');
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

  if (!analysis) {
    return (
      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center justify-center mx-auto">
            <Sparkles className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">Ready to Analyze @{profile.username}?</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            CreatorCalendar AI will examine your recent post formats, caption hooks, consistency, and calls-to-action to synthesize your content strategy.
          </p>
          <div className="pt-2">
            <Button
              size="md"
              variant="primary"
              icon={Sparkles}
              onClick={handleRunAnalysis}
              loading={analyzing}
            >
              Run AI Profile Analysis
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-100">@{profile.username} Intelligence Report</h1>
            <Badge variant="brand" size="sm">Analysis Complete</Badge>
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
            Re-Analyze
          </Button>

          <Button
            size="sm"
            variant="outline"
            icon={Lightbulb}
            onClick={() => navigate('/ideas')}
          >
            Generate Ideas
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

      {/* Profile Overview & Health Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 block font-medium">Content Consistency</span>
          <span className="text-2xl font-bold text-indigo-400 mt-1 block">
            {analysis.consistency?.indicator || 72}%
          </span>
          <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
            {analysis.consistency?.explanation}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 block font-medium">Content Variety</span>
          <span className="text-2xl font-bold text-amber-400 mt-1 block">
            {analysis.content_variety?.indicator || 54}%
          </span>
          <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
            {analysis.content_variety?.explanation}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 block font-medium">Caption Quality</span>
          <span className="text-2xl font-bold text-sky-400 mt-1 block">
            {analysis.caption_quality?.indicator || 68}%
          </span>
          <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
            {analysis.caption_quality?.explanation}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 block font-medium">CTA Usage</span>
          <span className="text-2xl font-bold text-rose-400 mt-1 block">
            {analysis.cta_usage?.indicator || 61}%
          </span>
          <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
            {analysis.cta_usage?.explanation}
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
              <h3 className="text-sm font-bold text-slate-100">Proven Strengths</h3>
              <p className="text-[11px] text-slate-400">What your current content executes well</p>
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
              <h3 className="text-sm font-bold text-slate-100">Content Bottlenecks & Weaknesses</h3>
              <p className="text-[11px] text-slate-400">Identified gaps holding back discovery</p>
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

export default ProfileAnalysis;
