import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Spinner } from '../components/common/Spinner';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { IdeaCard } from '../components/ideas/IdeaComponents';
import { useToast } from '../components/common/Toast';
import { Sparkles, Lightbulb, Plus, Filter, Calendar, ArrowLeft } from 'lucide-react';

export function Ideas() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeProfile, profiles } = useAuth();
  const toast = useToast();

  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [formatFilter, setFormatFilter] = useState('ALL');
  const [selectedPlatform, setSelectedPlatform] = useState('All');

  const fromFeedback = searchParams.get('source') === 'feedback';

  useEffect(() => {
    if (activeProfile?.id) {
      loadIdeas(activeProfile.id);
    } else {
      setLoading(false);
    }
  }, [activeProfile?.id]);

  const loadIdeas = async (pId) => {
    setLoading(true);
    try {
      const res = await api.ideas.list(pId);
      setIdeas(res.ideas || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load content ideas');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateIdeas = async () => {
    if (!activeProfile?.id) {
      toast.error('Please select or create a profile first');
      return;
    }
    setGenerating(true);
    try {
      const platParam = selectedPlatform !== 'All' ? selectedPlatform : undefined;
      const res = await api.ai.generateIdeas(activeProfile.id, platParam);
      toast.success(`Generated fresh creative ideas${platParam ? ` for ${platParam}` : ''}!`);
      await loadIdeas(activeProfile.id);
    } catch (err) {
      toast.error(err.message || 'Failed to generate ideas');
    } finally {
      setGenerating(false);
    }
  };

  const handleUseInCalendar = async (idea) => {
    try {
      // Schedule post for tomorrow by default
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      await api.posts.create({
        profile_id: activeProfile.id,
        scheduled_date: dateStr,
        content_type: idea.format,
        topic: idea.title,
        hook: idea.hook,
        caption: `${idea.concept}\n\n${idea.caption_direction}`,
        cta: idea.cta,
        goal: 'Engagement',
        suggested_time: '19:00',
        time_reason: idea.why_it_fits || 'Strategic fit',
        status: 'DRAFT'
      });

      toast.success('Idea added to calendar drafts!');
      navigate('/calendar');
    } catch (err) {
      toast.error(err.message || 'Failed to add idea to calendar');
    }
  };

  const filteredIdeas = formatFilter === 'ALL'
    ? ideas
    : ideas.filter(i => i.format?.toLowerCase() === formatFilter.toLowerCase());

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Spinner size="lg" />
        <p className="text-xs text-slate-400">Loading creative ideas...</p>
      </div>
    );
  }

  if (!activeProfile) {
    return (
      <EmptyState
        icon={Lightbulb}
        title="No Profile Selected"
        description="Select or add a profile to generate personalized content ideas tailored to your audience."
        actionLabel="Go to Profiles"
        onAction={() => navigate('/profiles')}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100">Creative Content Ideas</h1>
            <Badge variant="brand" size="sm">@{activeProfile.username}</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Personalized concepts designed to bridge format gaps identified in your profile feedback
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Platform:</span>
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="bg-slate-800 text-slate-200 border border-slate-700 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-brand-500"
            >
              <option value="All">All Platforms</option>
              <option value="Instagram">Instagram</option>
              <option value="YouTube">YouTube</option>
              <option value="TikTok">TikTok</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Facebook">Facebook</option>
            </select>
          </div>

          <Button
            variant="primary"
            size="sm"
            icon={Sparkles}
            onClick={handleGenerateIdeas}
            loading={generating}
          >
            Generate Ideas ({selectedPlatform})
          </Button>
        </div>
      </div>

      {fromFeedback && (
        <div className="p-4 rounded-2xl bg-brand-950/40 border border-brand-500/30 flex items-center justify-between gap-4 text-xs shadow-lg">
          <div className="flex items-center gap-2.5 text-slate-200">
            <Sparkles className="w-4 h-4 text-brand-400 shrink-0" />
            <span>
              Grounded in your latest <strong>Profile Feedback</strong>. These creative concepts directly solve your identified content gaps.
            </span>
          </div>
          <Button size="sm" variant="ghost" onClick={() => navigate('/feedback')} className="text-slate-400 hover:text-white shrink-0">
            View Feedback
          </Button>
        </div>
      )}

      {/* Filter Tabs */}
      {ideas.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {['ALL', 'Reel', 'Carousel', 'Story', 'Static Post'].map((fmt) => (
            <button
              key={fmt}
              onClick={() => setFormatFilter(fmt)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                formatFilter === fmt
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {fmt === 'ALL' ? 'All Formats' : fmt}
            </button>
          ))}
          <span className="text-xs text-slate-400 ml-auto">
            Showing {filteredIdeas.length} of {ideas.length} ideas
          </span>
        </div>
      )}

      {/* Grid of Idea Cards */}
      {filteredIdeas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredIdeas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              onUseInCalendar={handleUseInCalendar}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Lightbulb}
          title="No Creative Ideas Yet"
          description="Click 'Generate New Ideas' to let AI brainstorm tailored hooks, formats, and concepts based on your profile analysis."
          actionLabel="Generate Creative Ideas"
          actionIcon={Sparkles}
          onAction={handleGenerateIdeas}
        />
      )}
    </div>
  );
}

export default Ideas;
