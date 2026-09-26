import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Button } from '../components/common/Button';
import { Input, Textarea, Select } from '../components/common/Inputs';
import { Badge } from '../components/common/Badge';
import { Spinner } from '../components/common/Spinner';
import { RegeneratePostModal, PostStatusBadge } from '../components/posts/PostComponents';
import { useToast } from '../components/common/Toast';
import {
  ArrowLeft,
  Sparkles,
  Clock,
  Calendar,
  Save,
  Trash2,
  Copy,
  Check,
  Tag,
  Target
} from 'lucide-react';

export function PostDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);

  const [formData, setFormData] = useState({
    topic: '',
    hook: '',
    caption: '',
    cta: '',
    goal: '',
    content_type: 'Reel',
    suggested_time: '19:00',
    status: 'DRAFT',
    scheduled_date: '',
    hashtags: ''
  });

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    setLoading(true);
    try {
      const res = await api.posts.get(id);
      const p = res.post;
      setPost(p);
      setFormData({
        topic: p.topic || '',
        hook: p.hook || '',
        caption: p.caption || '',
        cta: p.cta || '',
        goal: p.goal || 'Engagement',
        content_type: p.content_type || 'Reel',
        suggested_time: p.suggested_time || '19:00',
        status: p.status || 'DRAFT',
        scheduled_date: p.scheduled_date ? new Date(p.scheduled_date).toISOString().split('T')[0] : '',
        hashtags: Array.isArray(p.hashtags) ? p.hashtags.join(', ') : ''
      });
    } catch (err) {
      toast.error(err.message || 'Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const tags = formData.hashtags
        .split(',')
        .map(h => h.trim())
        .filter(Boolean)
        .map(h => h.startsWith('#') ? h : `#${h}`);

      const res = await api.posts.update(id, {
        ...formData,
        hashtags: tags
      });

      setPost(res.post);
      toast.success('Post saved successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  const copyCaption = () => {
    const fullText = `${formData.caption}\n\n${formData.hashtags.split(',').map(h => h.trim()).join(' ')}`;
    navigator.clipboard.writeText(fullText);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
    toast.success('Full caption & hashtags copied to clipboard!');
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.posts.delete(id);
      toast.success('Post deleted');
      navigate('/calendar');
    } catch (err) {
      toast.error(err.message || 'Failed to delete post');
    }
  };

  if (loading || !post) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Spinner size="lg" />
        <p className="text-xs text-slate-400">Loading post editor...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            icon={copiedCaption ? Check : Copy}
            onClick={copyCaption}
          >
            {copiedCaption ? 'Copied!' : 'Copy for Instagram'}
          </Button>

          <Button
            size="sm"
            variant="primary"
            icon={Sparkles}
            onClick={() => setRegenerating(true)}
          >
            Regenerate with AI
          </Button>

          <Button
            size="sm"
            variant="danger"
            icon={Trash2}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <form onSubmit={handleSave} className="space-y-5">
          {/* Top metadata grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pb-4 border-b border-slate-800">
            <Select
              label="Format"
              value={formData.content_type}
              onChange={(e) => setFormData({ ...formData, content_type: e.target.value })}
              options={[
                { value: 'Reel', label: 'Reel' },
                { value: 'Carousel', label: 'Carousel' },
                { value: 'Story', label: 'Story' },
                { value: 'Static Post', label: 'Static Post' },
              ]}
            />

            <Input
              label="Scheduled Date"
              type="date"
              value={formData.scheduled_date}
              onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
            />

            <Input
              label="Suggested Time"
              value={formData.suggested_time}
              onChange={(e) => setFormData({ ...formData, suggested_time: e.target.value })}
            />

            <Select
              label="Publish Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'DRAFT', label: 'DRAFT' },
                { value: 'SCHEDULED', label: 'SCHEDULED' },
                { value: 'PUBLISHED', label: 'PUBLISHED' },
                { value: 'ARCHIVED', label: 'ARCHIVED' },
              ]}
            />
          </div>

          <Input
            label="Post Topic"
            value={formData.topic}
            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
            required
          />

          <div className="bg-slate-800/40 p-3.5 rounded-2xl border border-slate-800">
            <Input
              label="Opening Hook (First line that stops the scroll)"
              value={formData.hook}
              onChange={(e) => setFormData({ ...formData, hook: e.target.value })}
            />
          </div>

          <Textarea
            label="Full Caption & Body Copy"
            rows={8}
            value={formData.caption}
            onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Call to Action (CTA)"
              value={formData.cta}
              onChange={(e) => setFormData({ ...formData, cta: e.target.value })}
            />
            <Input
              label="Target Goal / Objective"
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
            />
          </div>

          <Input
            label="Hashtags (comma separated)"
            value={formData.hashtags}
            onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
          />

          {post.time_reason && (
            <p className="text-[11px] text-slate-400 font-mono">
              Timing Strategy: {post.time_reason}
            </p>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={Save}
              loading={saving}
            >
              Save Post Updates
            </Button>
          </div>
        </form>
      </div>

      {/* Regeneration Modal */}
      {regenerating && (
        <RegeneratePostModal
          isOpen={regenerating}
          onClose={() => setRegenerating(false)}
          post={post}
          onApplied={(updated) => {
            setPost(updated);
            setFormData({
              topic: updated.topic || '',
              hook: updated.hook || '',
              caption: updated.caption || '',
              cta: updated.cta || '',
              goal: updated.goal || 'Engagement',
              content_type: updated.content_type || 'Reel',
              suggested_time: updated.suggested_time || '19:00',
              status: updated.status || 'DRAFT',
              scheduled_date: updated.scheduled_date ? new Date(updated.scheduled_date).toISOString().split('T')[0] : '',
              hashtags: Array.isArray(updated.hashtags) ? updated.hashtags.join(', ') : ''
            });
          }}
        />
      )}
    </div>
  );
}

export default PostDetails;
