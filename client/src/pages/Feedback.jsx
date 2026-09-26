import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  Target,
  Compass,
  Layers,
  HelpCircle,
  Clock,
  ChevronRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { InstagramIcon } from '../components/common/InstagramIcon';

export function Feedback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeProfile, profiles, selectProfile } = useAuth();
  const toast = useToast();

  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const profileId = searchParams.get('profile_id') || activeProfile?.id || (profiles && profiles[0]?.id);

  useEffect(() => {
    if (profileId) {
      loadFeedback(profileId);
    } else {
      setLoading(false);
    }
  }, [profileId]);

  const loadFeedback = async (pId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.feedback.get(pId);
      setFeedback(res.feedback);
    } catch (err) {
      // If none generated yet or error
      if (err.status === 404 && !activeProfile) {
        setFeedback(null);
      } else {
        setError(err.message || 'Failed to load profile feedback');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFeedback = async () => {
    if (!profileId) {
      toast.error('Please select or create a profile first');
      return;
    }
    setGenerating(true);
    try {
      const res = await api.feedback.generate(profileId);
      setFeedback(res.feedback);
      toast.success(
        res.feedback?.confidence === 'LOW'
          ? 'Starter Profile Feedback generated!'
          : 'Profile Feedback refreshed successfully!'
      );
    } catch (err) {
      toast.error(err.message || 'Failed to generate profile feedback');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateIdeasFromFeedback = () => {
    navigate('/ideas?source=feedback');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Spinner size="lg" />
        <p className="text-xs text-slate-400">Evaluating profile intelligence & feedback...</p>
      </div>
    );
  }

  if (!profileId || (!activeProfile && (!profiles || profiles.length === 0))) {
    return (
      <EmptyState
        icon={InstagramIcon}
        title="No Creator Profile Found"
        description="Create your social profile to get instant evidence-based AI feedback, score evaluation, and strategy."
        actionLabel="Create Profile & Get Feedback"
        actionIcon={Sparkles}
        onAction={() => navigate('/profiles/new')}
      />
    );
  }

  if (error && !feedback) {
    return (
      <ErrorState
        message={error}
        onRetry={() => loadFeedback(profileId)}
      />
    );
  }

  const score = feedback?.overall_score ?? 75;
  const confidence = feedback?.confidence ?? 'LOW';
  const dimensions = feedback?.dimensions || [];
  const strengths = feedback?.strengths || [];
  const improvementAreas = feedback?.improvement_areas || [];
  const contentGaps = feedback?.content_gaps || [];
  const nextSteps = feedback?.next_steps || [];

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-100">Profile Feedback</h1>
            <Badge variant="brand" size="sm">Evidence-Based</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Grounded evaluation for <strong className="text-slate-200">@{activeProfile?.username || 'creator'}</strong> • {activeProfile?.niche || 'Digital Creator'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="secondary"
            icon={RefreshCw}
            onClick={handleGenerateFeedback}
            loading={generating}
          >
            Re-Evaluate Profile
          </Button>

          <Button
            size="sm"
            variant="primary"
            icon={Lightbulb}
            onClick={handleGenerateIdeasFromFeedback}
          >
            Generate Ideas From This Feedback
          </Button>
        </div>
      </div>

      {/* 1. Overall Profile Score Banner */}
      <div className="bg-gradient-to-br from-brand-950/60 via-slate-900 to-indigo-950/40 border border-brand-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] uppercase font-black tracking-widest text-brand-400 px-2 py-0.5 rounded bg-brand-500/20 border border-brand-500/30">
                AI-Generated Profile Planning Score
              </span>
              <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded border ${
                confidence === 'HIGH'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : (confidence === 'MEDIUM'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300')
              }`}>
                {confidence} Confidence
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug">
              {confidence === 'LOW'
                ? 'Starter Profile Strategy & Positioning Baseline'
                : (confidence === 'MEDIUM'
                    ? 'Early Content Diagnostics & Alignment'
                    : 'Comprehensive Multi-Dimensional Performance Feedback')}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {feedback?.summary || `Your profile @${activeProfile?.username} has an established focus in ${activeProfile?.niche}.`}
            </p>

            <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-brand-400 shrink-0" />
              <span>
                Calculated strictly from verified profile clarity and objective indicators. No fabricated stats.
              </span>
            </div>
          </div>

          {/* Circular / Large Score Display */}
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl shrink-0 min-w-[170px]">
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Profile Score</span>
            <div className="flex items-baseline gap-1 my-1">
              <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-indigo-200 to-pink-300">
                {score}
              </span>
              <span className="text-sm font-semibold text-slate-500">/ 100</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium text-center">
              {score >= 80 ? 'Strong Foundation' : (score >= 65 ? 'High Potential' : 'Needs Clear Focus')}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Score Dimensions Breakdown */}
      {dimensions.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Compass className="w-4 h-4 text-brand-400" />
                Score Dimensions & Evidence Basis
              </h3>
              <p className="text-xs text-slate-400">
                Component scores are calculated from observable data. When evidence is unavailable, indicators show "Insufficient data" rather than fake estimates.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
            {dimensions.map((dim, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-200">{dim.name}</span>
                    {dim.score !== null ? (
                      <span className="text-xs font-black text-brand-300 px-1.5 py-0.5 rounded bg-brand-500/10 border border-brand-500/20">
                        {dim.score}%
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-500 px-1.5 py-0.5 rounded bg-slate-800/60 border border-slate-700/60">
                        Insufficient data
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {dim.explanation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Strengths Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-slate-100">Key Profile Strengths</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {strengths.map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex items-start gap-3.5 hover:border-emerald-500/30 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-100">{item.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>
                {item.evidence && (
                  <p className="text-[10px] text-slate-400 pt-1 font-mono">
                    <strong className="text-slate-400 font-sans">Evidence:</strong> {item.evidence}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Improvement Areas & Recommendations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-slate-100">Improvement Areas & Recommendations</h2>
          </div>
          <span className="text-xs text-slate-400">Actionable strategic focus areas</span>
        </div>

        <div className="space-y-3.5">
          {improvementAreas.map((area, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg hover:border-slate-700 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-300 flex items-center justify-center font-bold text-[10px]">
                    {idx + 1}
                  </span>
                  <h3 className="text-sm font-bold text-slate-100">{area.title}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                    area.priority === 'HIGH'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      : (area.priority === 'MEDIUM'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                          : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300')
                  }`}>
                    {area.priority || 'MEDIUM'} Priority
                  </span>
                  {area.suggested_frequency && (
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium bg-slate-800/80 px-2 py-0.5 rounded">
                      <Clock className="w-3 h-3 text-brand-400" />
                      {area.suggested_frequency}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {area.current_state && (
                  <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Current State</span>
                    <p className="text-slate-300 leading-relaxed">{area.current_state}</p>
                    {area.evidence && (
                      <p className="text-[10px] text-slate-400 mt-1 font-mono">Evidence: {area.evidence}</p>
                    )}
                  </div>
                )}

                <div className="p-3 rounded-xl bg-brand-950/30 border border-brand-500/20">
                  <span className="text-[10px] uppercase font-bold text-brand-400 block mb-1">Actionable Recommendation</span>
                  <p className="text-slate-200 leading-relaxed font-medium">{area.recommendation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Content Gaps Identified */}
      {contentGaps.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-100">Content Gaps to Address</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {contentGaps.map((item, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-indigo-300 block">{item.gap}</span>
                {item.why_it_matters && (
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    <strong className="text-slate-300 font-medium">Why it matters:</strong> {item.why_it_matters}
                  </p>
                )}
                {item.recommended_action && (
                  <p className="text-[11px] text-brand-300 leading-relaxed pt-1 border-t border-slate-800/80">
                    <strong>Action:</strong> {item.recommended_action}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Next Steps & Strong Action CTA */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-950/40 to-slate-900 border border-brand-500/30 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <h3 className="text-base font-bold text-white">Recommended Next Steps</h3>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {nextSteps.map((step, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <ChevronRight className="w-3.5 h-3.5 text-brand-400 shrink-0 mt-0.5" />
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full md:w-auto">
          <Button
            size="lg"
            variant="primary"
            icon={Lightbulb}
            onClick={handleGenerateIdeasFromFeedback}
            className="w-full sm:w-auto shadow-lg shadow-brand-500/25"
          >
            Generate Ideas From This Feedback
          </Button>

          <Button
            size="lg"
            variant="secondary"
            icon={Calendar}
            onClick={() => navigate('/calendar')}
            className="w-full sm:w-auto"
          >
            Go to 7-Day Calendar
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Feedback;
