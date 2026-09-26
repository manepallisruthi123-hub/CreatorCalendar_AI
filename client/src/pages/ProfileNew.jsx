import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Button } from '../components/common/Button';
import { Input, Textarea, Select } from '../components/common/Inputs';
import { useToast } from '../components/common/Toast';
import { Sparkles, ArrowLeft, ShieldAlert, Globe } from 'lucide-react';
import { InstagramIcon } from '../components/common/InstagramIcon';

const ALL_PLATFORMS = ['Instagram', 'YouTube', 'TikTok', 'LinkedIn', 'Facebook'];

export function ProfileNew() {
  const navigate = useNavigate();
  const { refreshProfiles, selectProfile } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState({
    creator_name: 'Alex Vance',
    platform: 'Instagram',
    preferred_platforms: ['Instagram', 'YouTube', 'LinkedIn'],
    profile_url: 'https://instagram.com/alex_builds',
    username: 'alex_builds',
    niche: 'Technology Education & AI',
    target_audience: 'Engineers, students, and digital creators',
    content_goal: 'Engagement & Community Growth',
    preferred_tone: 'Educational & Friendly',
    timezone: 'Asia/Kolkata' // Defaulted to Indian Standard Time as requested
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fillDemoPreset = () => {
    setFormData({
      creator_name: 'Priya Sharma',
      platform: 'Instagram',
      preferred_platforms: ['Instagram', 'YouTube', 'LinkedIn'],
      profile_url: 'https://instagram.com/priyatech',
      username: 'priyatech',
      niche: 'Full-Stack Engineering & Web3',
      target_audience: 'Aspiring software engineers and creators',
      content_goal: 'Engagement & Follower Growth',
      preferred_tone: 'Educational & Practical',
      timezone: 'Asia/Kolkata'
    });
    toast.info('Filled with official Demo Creator preset (Asia/Kolkata)!');
  };

  const togglePlatform = (plat) => {
    setFormData(prev => {
      const exists = prev.preferred_platforms.includes(plat);
      let updated;
      if (exists) {
        if (prev.preferred_platforms.length === 1) return prev; // Keep at least one
        updated = prev.preferred_platforms.filter(p => p !== plat);
      } else {
        updated = [...prev.preferred_platforms, plat];
      }
      return { ...prev, preferred_platforms: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.profiles.create(formData);
      toast.success('Social profile created successfully!');
      await refreshProfiles();
      // Navigate directly to feedback flow as required
      navigate('/feedback');
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
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Create Creator Profile</h2>
            <p className="text-xs text-slate-400">Configure your multi-platform brand identity and strategy parameters</p>
          </div>
        </div>

        {/* Notice on Instagram Ingestion Abstraction */}
        <div className="mb-6 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-start gap-2.5 text-xs text-slate-300">
          <ShieldAlert className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-100">Zero Unauthorized Scraping Policy:</strong>
            <p className="mt-0.5 text-slate-400 leading-relaxed">
              We connect strictly via official platform APIs. If live API keys are not yet configured in your environment, you will seamlessly provide your recent post history via manual entry, 1-click sample load, or CSV import.
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
            <Input
              label="Creator / Brand Name"
              placeholder="e.g. Alex Vance"
              value={formData.creator_name}
              onChange={(e) => setFormData({ ...formData, creator_name: e.target.value })}
              required
            />
            <Input
              label="Primary Handle / Username"
              placeholder="e.g. alex_builds"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Primary Platform"
              value={formData.platform}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              options={[
                { value: 'Instagram', label: 'Instagram' },
                { value: 'YouTube', label: 'YouTube' },
                { value: 'TikTok', label: 'TikTok' },
                { value: 'LinkedIn', label: 'LinkedIn' },
                { value: 'Facebook', label: 'Facebook' },
              ]}
            />
            <Input
              label="Primary Profile URL"
              type="url"
              placeholder="https://instagram.com/alex_builds"
              value={formData.profile_url}
              onChange={(e) => setFormData({ ...formData, profile_url: e.target.value })}
              required
            />
          </div>

          {/* Multi-Platform Support Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Cross-Platform Distribution Channels
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {ALL_PLATFORMS.map((plat) => {
                const checked = formData.preferred_platforms.includes(plat);
                return (
                  <button
                    key={plat}
                    type="button"
                    onClick={() => togglePlatform(plat)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                      checked
                        ? 'bg-brand-600/30 text-brand-300 border-brand-500/50 shadow-sm'
                        : 'bg-slate-800/40 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {plat}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Select all platforms you plan to publish to. AI recommendations and 7-day calendars will adapt to these formats.
            </p>
          </div>

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
              placeholder="e.g. College students, developers"
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
                { value: 'Engagement & Growth', label: 'Engagement & Community Growth' },
                { value: 'Reach', label: 'Top-of-Funnel Viral Reach' },
                { value: 'Authority', label: 'Niche Authority & Thought Leadership' },
                { value: 'Conversion', label: 'Audience Conversion / Sales' },
              ]}
            />
            <Select
              label="Preferred Tone"
              value={formData.preferred_tone}
              onChange={(e) => setFormData({ ...formData, preferred_tone: e.target.value })}
              options={[
                { value: 'Professional', label: 'Professional' },
                { value: 'Friendly', label: 'Friendly' },
                { value: 'Funny', label: 'Funny' },
                { value: 'Bold', label: 'Bold' },
                { value: 'Educational', label: 'Educational' },
                { value: 'Short & punchy', label: 'Short & punchy' },
              ]}
            />
          </div>

          <Select
            label="Timezone (Default: Asia/Kolkata - IST)"
            value={formData.timezone}
            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
            options={[
              { value: 'Asia/Kolkata', label: 'India Standard Time (IST) - Asia/Kolkata' },
              { value: 'UTC', label: 'UTC' },
              { value: 'America/New_York', label: 'Eastern Time (US) - America/New_York' },
              { value: 'America/Los_Angeles', label: 'Pacific Time (US) - America/Los_Angeles' },
              { value: 'Europe/London', label: 'London (GMT/BST) - Europe/London' },
              { value: 'Asia/Dubai', label: 'Gulf Standard Time (GST) - Asia/Dubai' },
              { value: 'Asia/Singapore', label: 'Singapore Standard Time (SGT) - Asia/Singapore' }
            ]}
          />

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
            <Button variant="secondary" size="md" onClick={() => navigate('/profiles')}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" loading={loading}>
              Create Profile & Get Feedback
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfileNew;
