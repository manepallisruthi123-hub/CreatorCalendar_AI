import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input, Textarea, Select } from '../common/Inputs';
import { Badge } from '../common/Badge';
import { Sparkles, Check, RefreshCw, Clock, ArrowRight, X, AlertCircle, Info } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../common/Toast';

export function PostStatusBadge({ status }) {
  const map = {
    DRAFT: { variant: 'warning', label: 'Draft' },
    READY: { variant: 'info', label: 'Ready' },
    SCHEDULED: { variant: 'brand', label: 'Scheduled' },
    PUBLISHED: { variant: 'success', label: 'Published' },
    ARCHIVED: { variant: 'default', label: 'Archived' },
  };

  const item = map[status] || map.DRAFT;
  return <Badge variant={item.variant} size="sm">{item.label}</Badge>;
}

export function RegeneratePostModal({ isOpen, onClose, post, onApplied }) {
  const toast = useToast();
  const [tone, setTone] = useState('Professional');
  const [contentType, setContentType] = useState(post?.content_type || 'Reel');
  const [objective, setObjective] = useState(post?.goal || 'Engagement & Comments');
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleGeneratePreview = async () => {
    setLoading(true);
    try {
      const res = await api.ai.regeneratePost({
        post_id: post.id,
        tone,
        content_type: contentType,
        objective,
        instruction
      });
      setPreview(res.preview);
      toast.success('Regeneration preview ready! Compare Original vs New Version below.');
    } catch (err) {
      toast.error(err.message || 'Failed to regenerate post');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!preview) return;
    setApplying(true);
    try {
      const res = await api.ai.applyRegeneratedPost(post.id, preview);
      toast.success('New version applied successfully!');
      if (onApplied) onApplied(res.post);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to apply new version');
    } finally {
      setApplying(false);
    }
  };

  if (!post) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Regenerate Post with AI"
      subtitle={`Transform this post with new tone and perspective`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4">
        {/* Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Tone"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            options={[
              { value: 'Professional', label: 'Professional' },
              { value: 'Friendly', label: 'Friendly' },
              { value: 'Funny', label: 'Funny' },
              { value: 'Witty', label: 'Witty' },
              { value: 'Bold', label: 'Bold' },
              { value: 'Educational', label: 'Educational' },
              { value: 'Short & punchy', label: 'Short & punchy' },
            ]}
          />
          <Select
            label="Format"
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
            options={[
              { value: 'Reel', label: 'Reel (Short Video)' },
              { value: 'Short', label: 'YouTube Short' },
              { value: 'Carousel', label: 'Multi-Slide Carousel' },
              { value: 'Thought Leadership', label: 'Thought Leadership Post' },
              { value: 'Story', label: 'Interactive Story' },
              { value: 'Static Post', label: 'Static Post' },
            ]}
          />
          <Select
            label="Goal / Objective"
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            options={[
              { value: 'Engagement & Comments', label: 'Engagement & Comments' },
              { value: 'Saves & Bookmarks', label: 'Saves & Bookmarks' },
              { value: 'Top-of-Funnel Reach', label: 'Top-of-Funnel Reach' },
              { value: 'Community Discussion', label: 'Community Discussion' },
            ]}
          />
        </div>

        <Input
          label="Custom Direction (Optional)"
          placeholder="e.g. Focus on common beginner mistakes, make hook dramatic..."
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
        />

        <div className="flex justify-end">
          <Button
            size="sm"
            variant="primary"
            icon={Sparkles}
            onClick={handleGeneratePreview}
            loading={loading}
          >
            Generate Replacement Preview
          </Button>
        </div>

        {/* Side-by-Side Comparison: Original vs New Version */}
        {preview && (
          <div className="mt-4 pt-4 border-t border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Version Comparison (Original vs New Version)
              </span>
              <span className="text-[11px] text-slate-400">Review changes before applying</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ORIGINAL CARD */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                    Original Version
                  </span>
                  <Badge variant="default" size="sm">{post.content_type}</Badge>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Topic</span>
                  <p className="text-xs font-bold text-slate-200 mt-0.5">{post.topic}</p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Hook</span>
                  <p className="text-xs italic text-slate-300">"{post.hook}"</p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Caption</span>
                  <p className="text-xs text-slate-300 whitespace-pre-line mt-1 max-h-40 overflow-y-auto p-2.5 rounded-lg bg-slate-800/30 border border-slate-800 leading-relaxed">
                    {post.caption}
                  </p>
                </div>

                <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span>CTA: <strong className="text-slate-300">{post.cta}</strong></span>
                  <span>{post.suggested_time}</span>
                </div>
              </div>

              {/* NEW VERSION CARD */}
              <div className="p-4 rounded-xl bg-purple-950/20 border border-brand-500/40 space-y-3 shadow-lg shadow-brand-500/5">
                <div className="flex items-center justify-between border-b border-brand-500/30 pb-2">
                  <span className="text-xs font-bold text-brand-300 uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-brand-400" /> New Version ({tone})
                  </span>
                  <Badge variant="brand" size="sm">{preview.content_type}</Badge>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-semibold text-brand-300">Topic</span>
                  <p className="text-xs font-bold text-white mt-0.5">{preview.topic}</p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-brand-500/30">
                  <span className="text-[10px] uppercase font-semibold text-brand-400 block mb-1">New Hook</span>
                  <p className="text-xs italic font-semibold text-purple-100">"{preview.hook}"</p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-semibold text-brand-300">New Caption</span>
                  <p className="text-xs text-slate-200 whitespace-pre-line mt-1 max-h-40 overflow-y-auto p-2.5 rounded-lg bg-slate-900/80 border border-brand-500/20 leading-relaxed">
                    {preview.caption}
                  </p>
                </div>

                <div className="text-[11px] text-slate-400 pt-2 border-t border-brand-500/20 flex items-center justify-between">
                  <span>CTA: <strong className="text-slate-200">{preview.cta}</strong></span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-brand-400" /> {preview.suggested_time}</span>
                </div>
              </div>
            </div>

            {/* Decision Buttons: Keep Original vs Apply New Version */}
            <div className="mt-4 pt-3 flex items-center justify-between border-t border-slate-800">
              <Button
                size="sm"
                variant="secondary"
                icon={X}
                onClick={() => setPreview(null)}
              >
                Keep Original
              </Button>
              <Button
                size="sm"
                variant="success"
                icon={Check}
                onClick={handleApply}
                loading={applying}
              >
                Apply New Version
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

export function PostEditorModal({ isOpen, onClose, post, onSaved }) {
  const toast = useToast();
  const [formData, setFormData] = useState({
    topic: post?.topic || '',
    hook: post?.hook || '',
    caption: post?.caption || '',
    cta: post?.cta || '',
    content_type: post?.content_type || 'Reel',
    goal: post?.goal || 'Engagement',
    suggested_time: post?.suggested_time || '19:00',
    status: post?.status || 'DRAFT',
    hashtags: Array.isArray(post?.hashtags) ? post.hashtags.join(', ') : ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const hashtagsArray = formData.hashtags
        .split(',')
        .map(h => h.trim())
        .filter(Boolean)
        .map(h => (h.startsWith('#') ? h : `#${h}`));

      const payload = {
        ...formData,
        hashtags: hashtagsArray
      };

      const res = await api.posts.update(post.id, payload);
      toast.success('Post updated successfully!');
      if (onSaved) onSaved(res.post);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to update post');
    } finally {
      setLoading(false);
    }
  };

  const isPublishOrScheduled = formData.status === 'SCHEDULED' || formData.status === 'PUBLISHED';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Post"
      subtitle={`Scheduled for ${post?.scheduled_date ? new Date(post.scheduled_date).toLocaleDateString() : ''}`}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Format"
            value={formData.content_type}
            onChange={(e) => setFormData({ ...formData, content_type: e.target.value })}
            options={[
              { value: 'Reel', label: 'Reel' },
              { value: 'Short', label: 'Short' },
              { value: 'Carousel', label: 'Carousel' },
              { value: 'Thought Leadership', label: 'Thought Leadership' },
              { value: 'Story', label: 'Story' },
              { value: 'Static Post', label: 'Static Post' },
            ]}
          />
          <Input
            label="Suggested Time"
            value={formData.suggested_time}
            onChange={(e) => setFormData({ ...formData, suggested_time: e.target.value })}
          />
          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={[
              { value: 'DRAFT', label: 'DRAFT' },
              { value: 'READY', label: 'READY' },
              { value: 'SCHEDULED', label: 'SCHEDULED' },
              { value: 'PUBLISHED', label: 'PUBLISHED' },
              { value: 'ARCHIVED', label: 'ARCHIVED' },
            ]}
          />
        </div>

        {/* Informative notice for direct publishing integration */}
        {isPublishOrScheduled && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Publishing integration not configured.</span> Status marked as <strong className="underline">{formData.status}</strong> for internal calendar tracking. Real auto-publishing requires verified developer API write credentials.
            </div>
          </div>
        )}

        <Input
          label="Topic"
          value={formData.topic}
          onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
          required
        />

        <Input
          label="Opening Hook"
          value={formData.hook}
          onChange={(e) => setFormData({ ...formData, hook: e.target.value })}
        />

        <Textarea
          label="Caption"
          rows={5}
          value={formData.caption}
          onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Call to Action (CTA)"
            value={formData.cta}
            onChange={(e) => setFormData({ ...formData, cta: e.target.value })}
          />
          <Input
            label="Hashtags (comma separated)"
            value={formData.hashtags}
            onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={loading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default {
  PostStatusBadge,
  RegeneratePostModal,
  PostEditorModal
};
