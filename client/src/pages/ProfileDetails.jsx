import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Button } from '../components/common/Button';
import { Input, Textarea, Select } from '../components/common/Inputs';
import { Badge } from '../components/common/Badge';
import { Spinner } from '../components/common/Spinner';
import { useToast } from '../components/common/Toast';
import {
  ArrowLeft,
  Sparkles,
  ExternalLink,
  Lightbulb,
  Calendar,
  Globe,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Edit3
} from 'lucide-react';
import { InstagramIcon } from '../components/common/InstagramIcon';

export function ProfileDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectProfile } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.profiles.get(id);
      setProfile(res.profile);
      setEditForm({
        niche: res.profile.niche || '',
        target_audience: res.profile.target_audience || '',
        content_goal: res.profile.content_goal || '',
        preferred_tone: res.profile.preferred_tone || '',
        timezone: res.profile.timezone || 'Asia/Kolkata',
        profile_url: res.profile.profile_url || ''
      });
      selectProfile(res.profile);
    } catch (err) {
      toast.error(err.message || 'Failed to load profile details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.profiles.update(id, editForm);
      setProfile(updated.profile || { ...profile, ...editForm });
      setEditing(false);
      toast.success('Profile details updated successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Spinner size="lg" />
        <p className="text-xs text-slate-400">Loading creator profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400 mb-4">Profile not found.</p>
        <Button variant="secondary" onClick={() => navigate('/profiles')}>
          Back to Profiles
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <button
          onClick={() => navigate('/profiles')}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Profiles
        </button>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="secondary"
            icon={Edit3}
            onClick={() => setEditing(!editing)}
          >
            {editing ? 'Cancel Editing' : 'Edit Profile'}
          </Button>

          <Button
            size="sm"
            variant="primary"
            icon={Sparkles}
            onClick={() => navigate(`/feedback?profile_id=${profile.id}`)}
          >
            Get AI Feedback
          </Button>
        </div>
      </div>

      {/* Main Profile Info Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-500 flex items-center justify-center text-white shadow-xl shadow-pink-500/20">
              <InstagramIcon className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-100">@{profile.username}</h1>
                <a
                  href={profile.profile_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-slate-200 p-1"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <p className="text-xs text-brand-400 font-semibold mt-0.5">{profile.niche}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="brand" size="md">{profile.platform}</Badge>
            <Badge variant="outline" size="md">
              <Clock className="w-3 h-3 mr-1 text-slate-400" />
              {profile.timezone || 'Asia/Kolkata'}
            </Badge>
          </div>
        </div>

        {/* Profile Positioning Details Grid */}
        {!editing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Target Audience</span>
              <p className="text-xs text-slate-200 font-medium">{profile.target_audience || 'General'}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Content Goal</span>
              <p className="text-xs text-slate-200 font-medium">{profile.content_goal || 'Growth & Authority'}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Brand Tone</span>
              <p className="text-xs text-slate-200 font-medium">{profile.preferred_tone || 'Educational & Authentic'}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Profile URL</span>
              <a
                href={profile.profile_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-brand-400 truncate block hover:underline"
              >
                {profile.profile_url}
              </a>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Preferred Timezone</span>
              <p className="text-xs text-slate-200 font-medium">{profile.timezone || 'Asia/Kolkata'}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Available Social Data</span>
              <p className="text-xs text-slate-200 font-medium">Grounded in profile parameters</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Niche"
                value={editForm.niche}
                onChange={(e) => setEditForm({ ...editForm, niche: e.target.value })}
                required
              />
              <Input
                label="Target Audience"
                value={editForm.target_audience}
                onChange={(e) => setEditForm({ ...editForm, target_audience: e.target.value })}
                required
              />
              <Input
                label="Content Goal"
                value={editForm.content_goal}
                onChange={(e) => setEditForm({ ...editForm, content_goal: e.target.value })}
                required
              />
              <Input
                label="Preferred Tone"
                value={editForm.preferred_tone}
                onChange={(e) => setEditForm({ ...editForm, preferred_tone: e.target.value })}
                required
              />
            </div>

            <Select
              label="Timezone (Default: Asia/Kolkata)"
              value={editForm.timezone}
              onChange={(e) => setEditForm({ ...editForm, timezone: e.target.value })}
              options={[
                { value: 'Asia/Kolkata', label: 'India Standard Time (IST) - Asia/Kolkata' },
                { value: 'UTC', label: 'UTC' },
                { value: 'America/New_York', label: 'Eastern Time (US) - America/New_York' },
                { value: 'America/Los_Angeles', label: 'Pacific Time (US) - America/Los_Angeles' },
                { value: 'Europe/London', label: 'London (GMT/BST) - Europe/London' }
              ]}
            />

            <div className="flex justify-end gap-2.5 pt-3">
              <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={saving}>
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Strategy Next Steps Banner */}
      <div className="bg-gradient-to-r from-brand-950/40 via-slate-900 to-indigo-950/40 border border-brand-500/20 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-400" />
            Turn this profile into your content strategy
          </h3>
          <p className="text-xs text-slate-400">
            Get an evidence-based profile evaluation score, improvement recommendations, and a 7-day calendar.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            size="sm"
            variant="secondary"
            icon={Lightbulb}
            onClick={() => navigate('/ideas')}
          >
            Creative Ideas
          </Button>

          <Button
            size="sm"
            variant="primary"
            icon={Sparkles}
            onClick={() => navigate(`/feedback?profile_id=${profile.id}`)}
          >
            View Feedback
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ProfileDetails;
