import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input, Textarea, Select } from '../common/Inputs';
import { Badge } from '../common/Badge';
import { Sparkles, Check, ArrowRight, RefreshCw, Clock } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../common/Toast';

export function PostStatusBadge({ status }) {
  const map = {
    DRAFT: { variant: 'warning', label: 'Draft' },
    SCHEDULED: { variant: 'brand', label: 'Scheduled' },
    PUBLISHED: { variant: 'success', label: 'Published' },
    ARCHIVED: { variant: 'default', label: 'Archived' },
  };

  const item = map[status] || map.DRAFT;
  return <Badge variant={item.variant} size="sm">{item.label}</Badge>;
}

export function RegeneratePostModal({ isOpen, onClose, post, onApplied }) {
  const toast = useToast();
  const [tone, setTone] = useState('Funny');
  const [contentType, setContentType] = useState(post?.content_type || 'Reel');
  const [objective, setObjective] = useState(post?.goal || 'Engagement');
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleGeneratePreview = async () => {
    setLoading(true);
    setPreview(null);
    try {
      const res = await api.ai.regeneratePost({
        post_id: post.id,
        tone,
        content_type: contentType,
        objective,
        instruction
      });
      setPreview(res.preview);
      toast.success('Preview generated! Review before applying.');
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
      subtitle={`Transform this ${post.content_type} while preserving your niche & audience`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Tone"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            options={[
              { value: 'Funny', label: 'Funny & Relatable' },
              { value: 'Witty', label: 'Witty & Sharp' },
              { value: 'Inspirational', label: 'Inspirational & Motivating' },
              { value: 'Authoritative', label: 'Deeply Technical / Authority' },
              { value: 'Casual', label: 'Casual / Behind-the-Scenes' },
            ]}
          />
          <Select
            label="Content Type"
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
            options={[
              { value: 'Reel', label: 'Reel (Short Video)' },
              { value: 'Carousel', label: 'Multi-Slide Carousel' },
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
          label="Custom Instruction (Optional)"
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

        {/* Preview Section */}
        {preview && (
          <div className="mt-4 pt-4 border-t border-slate-800 space-y-3 bg-brand-950/20 border border-brand-500/30 rounded-xl p-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-brand-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Replacement Preview (Not saved yet)
              </span>
              <Badge variant="brand" size="sm">{preview.content_type}</Badge>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Topic</span>
              <p className="text-xs font-bold text-slate-100">{preview.topic}</p>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <span className="text-[10px] font-semibold text-brand-400 uppercase block mb-1">New Hook</span>
              <p className="text-xs font-semibold text-slate-200 italic">"{preview.hook}"</p>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">New Caption</span>
              <p className="text-xs text-slate-300 whitespace-pre-line mt-1 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                {preview.caption}
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
              <span>CTA: <strong className="text-slate-300">{preview.cta}</strong></span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {preview.suggested_time}</span>
            </div>

            {/* Apply Button */}
            <div className="mt-4 pt-3 flex justify-end gap-2">
              <Button size="sm" variant="secondary" onClick={() => setPreview(null)}>
                Discard Preview
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
              { value: 'Carousel', label: 'Carousel' },
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
              { value: 'SCHEDULED', label: 'SCHEDULED' },
              { value: 'PUBLISHED', label: 'PUBLISHED' },
              { value: 'ARCHIVED', label: 'ARCHIVED' },
            ]}
          />
        </div>

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
