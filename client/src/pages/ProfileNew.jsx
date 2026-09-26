import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Button } from '../components/common/Button';
import { Input, Textarea, Select } from '../components/common/Inputs';
import { useToast } from '../components/common/Toast';
import { Sparkles, ArrowLeft, ShieldAlert } from 'lucide-react';
import { InstagramIcon } from '../components/common/InstagramIcon';

export function ProfileNew() {
  const navigate = useNavigate();
  const { refreshProfiles, selectProfile } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState({
    platform: 'Instagram',
    profile_url: 'https://instagram.com/demo_creator',
    username: 'demo_creator',
    niche: 'Technology Education',
    target_audience: 'College students and junior developers',
    content_goal: 'Engagement & Community Growth',
    preferred_tone: 'Educational & Friendly',
    timezone: 'UTC'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fillDemoPreset = () => {
    setFormData({
      platform: 'Instagram',
      profile_url: 'https://instagram.com/demo_creator',
      username: 'demo_creator',
      niche: 'Technology',
      target_audience: 'College students',
      content_goal: 'Engagement',
      preferred_tone: 'Friendly',
      timezone: 'UTC'
    });
    toast.info('Filled with official Demo Creator preset!');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.profiles.create(formData);
      toast.success('Social profile created successfully!');
      await refreshProfiles();
      selectProfile(res.profile);
      // Navigate to post import flow as requested by specification
      navigate('/posts/import');
    } catch (err) {
      setError(err.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <button
          onClick={() => navigate('/profiles')}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Profiles
        </button>
        <Button
          size="sm"
          variant="secondary"
          icon={Sparkles}
          onClick={fillDemoPreset}
        >
          Fill Demo Preset
        </Button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
            <InstagramIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Connect Social Profile</h2>
            <p className="text-xs text-slate-400">Configure your brand identity and audience targeting</p>
          </div>
        </div>

        {/* Notice on Instagram Ingestion Abstraction */}
        <div className="mb-6 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-start gap-2.5 text-xs text-slate-300">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-100">Zero Unauthorized Scraping Policy:</strong>
            <p className="mt-0.5 text-slate-400 leading-relaxed">
              We respect platform terms. If automatic live profile retrieval is unavailable, you will seamlessly provide your recent post history via manual entry, 1-click sample load, or CSV import.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Platform"
              value={formData.platform}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              options={[
                { value: 'Instagram', label: 'Instagram' },
                { value: 'TikTok', label: 'TikTok (Coming Soon)' },
                { value: 'LinkedIn', label: 'LinkedIn (Coming Soon)' },
              ]}
            />
            <Input
              label="Username"
              placeholder="e.g. demo_creator"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>

          <Input
            label="Profile URL"
            type="url"
            placeholder="https://instagram.com/demo_creator"
            value={formData.profile_url}
            onChange={(e) => setFormData({ ...formData, profile_url: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Content Niche"
              placeholder="e.g. Technology, Fitness, Food"
              value={formData.niche}
              onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
              required
            />
            <Input
              label="Target Audience"
              placeholder="e.g. College students, founders"
              value={formData.target_audience}
              onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Content Goal"
              value={formData.content_goal}
              onChange={(e) => setFormData({ ...formData, content_goal: e.target.value })}
              options={[
                { value: 'Engagement', label: 'Engagement & Community' },
                { value: 'Growth', label: 'Top-of-Funnel Follower Growth' },
                { value: 'Authority', label: 'Niche Authority & Thought Leadership' },
                { value: 'Conversion', label: 'Lead Generation / Sales' },
              ]}
            />
            <Select
              label="Preferred Tone"
              value={formData.preferred_tone}
              onChange={(e) => setFormData({ ...formData, preferred_tone: e.target.value })}
              options={[
                { value: 'Friendly', label: 'Friendly & Accessible' },
                { value: 'Educational', label: 'Educational & Practical' },
                { value: 'Authoritative', label: 'Authoritative & Technical' },
                { value: 'Witty', label: 'Witty & Relatable' },
                { value: 'Inspirational', label: 'Inspirational & Motivating' },
              ]}
            />
          </div>

          <Select
            label="Timezone"
            value={formData.timezone}
            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
            options={[
              { value: 'UTC', label: 'UTC' },
              { value: 'America/New_York', label: 'Eastern Time (US)' },
              { value: 'America/Los_Angeles', label: 'Pacific Time (US)' },
              { value: 'Europe/London', label: 'London (GMT/BST)' },
              { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
            ]}
          />

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
            <Button variant="secondary" size="md" onClick={() => navigate('/profiles')}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" loading={loading}>
              Create & Proceed to Post Ingestion
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfileNew;
