import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Button } from '../components/common/Button';
import { Input, Textarea, Select } from '../components/common/Inputs';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Spinner } from '../components/common/Spinner';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../components/common/Toast';
import { Target, Plus, Calendar, Clock, Trash2, CheckCircle2 } from 'lucide-react';

export function Campaigns() {
  const navigate = useNavigate();
  const { activeProfile } = useAuth();
  const toast = useToast();

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: 'Q3 Audience Engagement Sprint',
    objective: 'Increase comment rate and interactive story sticker taps by 25%',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    status: 'ACTIVE'
  });

  useEffect(() => {
    if (activeProfile?.id) {
      loadCampaigns();
    } else {
      setLoading(false);
    }
  }, [activeProfile?.id]);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const res = await api.campaigns.list(activeProfile?.id);
      setCampaigns(res.campaigns || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.campaigns.create({
        profile_id: activeProfile.id,
        ...formData
      });
      toast.success('Campaign created successfully!');
      setModalOpen(false);
      await loadCampaigns();
    } catch (err) {
      toast.error(err.message || 'Failed to create campaign');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (campId) => {
    try {
      await api.campaigns.delete(campId);
      toast.success('Campaign removed');
      setCampaigns(prev => prev.filter(c => c.id !== campId));
    } catch (err) {
      toast.error(err.message || 'Failed to delete campaign');
    }
  };

  if (!activeProfile) {
    return (
      <EmptyState
        icon={Target}
        title="No Profile Selected"
        description="Select or add a profile to track content campaigns."
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
            <h1 className="text-xl font-bold text-slate-100">Growth Campaigns</h1>
            <Badge variant="brand" size="sm">@{activeProfile.username}</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Organize content plans into focused multi-week growth sprints and objectives
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => setModalOpen(true)}
        >
          Create Campaign
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Spinner size="lg" />
          <p className="text-xs text-slate-400">Loading campaigns...</p>
        </div>
      ) : campaigns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {campaigns.map((camp) => (
            <div key={camp.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={camp.status === 'ACTIVE' ? 'success' : 'default'} size="sm">
                    {camp.status}
                  </Badge>
                  <button
                    onClick={() => handleDelete(camp.id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                    title="Delete campaign"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="text-base font-bold text-slate-100">{camp.name}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{camp.objective}</p>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-400" />
                  {camp.start_date} to {camp.end_date}
                </span>
                <Button size="sm" variant="outline" onClick={() => navigate('/calendar')}>
                  View Calendar
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Target}
          title="No Campaigns Created Yet"
          description="Create a campaign sprint (e.g. 'Build Authority in 30 Days' or 'Product Launch') to focus your weekly calendar output."
          actionLabel="Create Campaign"
          actionIcon={Plus}
          onAction={() => setModalOpen(true)}
        />
      )}

      {/* Create Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create New Campaign"
        subtitle={`Tie your content strategy to specific objectives for @${activeProfile.username}`}
      >
        <form onSubmit={handleCreateCampaign} className="space-y-4">
          <Input
            label="Campaign Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Textarea
            label="Primary Objective & Success Metrics"
            rows={3}
            value={formData.objective}
            onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
            />
            <Input
              label="End Date"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={saving}>
              Create Campaign
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Campaigns;
