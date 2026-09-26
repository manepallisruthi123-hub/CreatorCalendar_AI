import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Spinner } from '../components/common/Spinner';
import { EmptyState } from '../components/common/EmptyState';
import { WeeklyCalendar } from '../components/calendar/CalendarComponents';
import { PostEditorModal, RegeneratePostModal } from '../components/posts/PostComponents';
import { useToast } from '../components/common/Toast';
import {
  Calendar as CalendarIcon,
  Sparkles,
  Plus,
  Target,
  RefreshCw,
  Clock,
  Filter,
  CheckCircle2
} from 'lucide-react';

export function Calendar() {
  const navigate = useNavigate();
  const { activeProfile } = useAuth();
  const toast = useToast();

  const [posts, setPosts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [latestPlan, setLatestPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Modals state
  const [editingPost, setEditingPost] = useState(null);
  const [regeneratingPost, setRegeneratingPost] = useState(null);

  useEffect(() => {
    if (activeProfile?.id) {
      loadCalendarData(activeProfile.id);
    } else {
      setLoading(false);
    }
  }, [activeProfile?.id]);

  const loadCalendarData = async (pId) => {
    setLoading(true);
    try {
      // 1. Load plans
      const plansRes = await api.calendar.getPlans(pId);
      setPlans(plansRes.plans || []);
      if (plansRes.plans && plansRes.plans.length > 0) {
        setLatestPlan(plansRes.plans[0]);
      }

      // 2. Load posts
      const postsRes = await api.posts.list({ profile_id: pId });
      setPosts(postsRes.posts || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load calendar');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCalendar = async () => {
    if (!activeProfile?.id) return;
    setGenerating(true);
    try {
      const res = await api.calendar.generatePlan(activeProfile.id);
      toast.success('7-Day Content Plan & Calendar generated!');
      await loadCalendarData(activeProfile.id);
    } catch (err) {
      toast.error(err.message || 'Failed to generate calendar');
    } finally {
      setGenerating(false);
    }
  };

  const handleStatusChange = async (postId, newStatus) => {
    try {
      await api.posts.updateStatus(postId, newStatus);
      toast.success(`Post marked as ${newStatus}`);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, status: newStatus } : p));
    } catch (err) {
      toast.error(err.message || 'Failed to update post status');
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await api.posts.delete(postId);
      toast.success('Post removed from calendar');
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      toast.error(err.message || 'Failed to delete post');
    }
  };

  // Group posts by scheduled_date
  const postsByDate = {};
  posts.forEach(p => {
    const d = p.scheduled_date ? new Date(p.scheduled_date).toISOString().split('T')[0] : 'undated';
    if (!postsByDate[d]) postsByDate[d] = [];
    postsByDate[d].push(p);
  });

  // Calculate 7 days for the active week
  const weekDays = [];
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Start from upcoming Monday or latest plan week_start
  let baseDate = new Date();
  if (latestPlan?.week_start) {
    baseDate = new Date(latestPlan.week_start);
  } else {
    const day = baseDate.getDay();
    const diff = (1 + 7 - day) % 7 || 7;
    baseDate.setDate(baseDate.getDate() + diff);
  }

  for (let i = 0; i < 7; i++) {
    const cur = new Date(baseDate);
    cur.setDate(baseDate.getDate() + i);
    const dateStr = cur.toISOString().split('T')[0];
    weekDays.push({
      day: daysOfWeek[i],
      date: dateStr
    });
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Spinner size="lg" />
        <p className="text-xs text-slate-400">Loading weekly content calendar...</p>
      </div>
    );
  }

  if (!activeProfile) {
    return (
      <EmptyState
        icon={CalendarIcon}
        title="No Profile Selected"
        description="Select or add a profile to plan and manage your weekly content calendar."
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
            <h1 className="text-xl font-bold text-slate-100">7-Day Content Calendar</h1>
            <Badge variant="brand" size="sm">@{activeProfile.username}</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Cohesive weekly publishing schedule balanced across high-retention formats
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            icon={Sparkles}
            onClick={handleGenerateCalendar}
            loading={generating}
          >
            {posts.length > 0 ? 'Generate New 7-Day Plan' : 'Generate 7-Day Plan'}
          </Button>
        </div>
      </div>

      {/* AI Strategy Banner (Section 13) */}
      {latestPlan && (
        <div className="bg-slate-900 border border-brand-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-brand-400 tracking-wider">
                  Active Campaign Strategy
                </span>
                <Badge variant="brand" size="sm">Week of {latestPlan.week_start}</Badge>
              </div>
              <h2 className="text-lg font-bold text-slate-100 mt-1">"{latestPlan.campaign_theme}"</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-3xl">
                {latestPlan.strategy_summary}
              </p>
            </div>
          </div>

          {/* Pillars & Mix */}
          {latestPlan.strategy_json && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block mb-1.5 uppercase">
                  Content Pillars
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(latestPlan.strategy_json.content_pillars || []).map((pillar, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-medium text-[11px]">
                      {pillar}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 block mb-1.5 uppercase">
                  Target Format Mix
                </span>
                <div className="flex flex-wrap gap-2">
                  {(latestPlan.strategy_json.content_mix || []).map((mix, idx) => (
                    <span key={idx} className="text-slate-300 text-[11px]">
                      <strong className="text-brand-300">{mix.content_type}:</strong> {mix.percentage}%
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Weekly Grid */}
      {posts.length > 0 ? (
        <WeeklyCalendar
          days={weekDays}
          postsByDate={postsByDate}
          onAddPost={(dateStr) => {
            setEditingPost({
              profile_id: activeProfile.id,
              scheduled_date: dateStr,
              topic: '',
              hook: '',
              caption: '',
              content_type: 'Reel',
              status: 'DRAFT',
              suggested_time: '19:00',
              cta: ''
            });
          }}
          onEditPost={(post) => setEditingPost(post)}
          onRegeneratePost={(post) => setRegeneratingPost(post)}
          onStatusChange={handleStatusChange}
          onDeletePost={handleDeletePost}
        />
      ) : (
        <EmptyState
          icon={CalendarIcon}
          title="No Scheduled Calendar Posts"
          description="Click 'Generate 7-Day Plan' to let AI construct an integrated weekly strategy with diverse formats, hooks, captions, and recommended posting times."
          actionLabel="Generate 7-Day Plan"
          actionIcon={Sparkles}
          onAction={handleGenerateCalendar}
        />
      )}

      {/* Post Editor Modal */}
      {editingPost && (
        <PostEditorModal
          isOpen={Boolean(editingPost)}
          onClose={() => setEditingPost(null)}
          post={editingPost}
          onSaved={(updated) => {
            setPosts(prev => prev.map(p => p.id === updated.id ? updated : p));
          }}
        />
      )}

      {/* AI Post Regenerate Modal */}
      {regeneratingPost && (
        <RegeneratePostModal
          isOpen={Boolean(regeneratingPost)}
          onClose={() => setRegeneratingPost(null)}
          post={regeneratingPost}
          onApplied={(updated) => {
            setPosts(prev => prev.map(p => p.id === updated.id ? updated : p));
          }}
        />
      )}
    </div>
  );
}

export default Calendar;
