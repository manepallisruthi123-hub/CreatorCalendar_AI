import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ProfileCard } from '../components/profiles/ProfileComponents';
import { Button } from '../components/common/Button';
import { Spinner } from '../components/common/Spinner';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useToast } from '../components/common/Toast';
import { Plus, Sparkles, RefreshCw } from 'lucide-react';
import { InstagramIcon } from '../components/common/InstagramIcon';

export function Profiles() {
  const navigate = useNavigate();
  const { profiles, refreshProfiles, selectProfile } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleAnalyze = async (profile) => {
    selectProfile(profile);
    navigate(`/feedback?profile_id=${profile.id}`);
  };

  const confirmDelete = async () => {
    if (!profileToDelete) return;
    setDeleting(true);
    try {
      await api.profiles.delete(profileToDelete.id);
      toast.success('Profile deleted');
      await refreshProfiles();
      setProfileToDelete(null);
    } catch (err) {
      toast.error(err.message || 'Failed to delete profile');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Social Profiles</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your creator profiles, brand positioning, and AI strategy
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => navigate('/profiles/new')}
        >
          Add Social Profile
        </Button>
      </div>

      {profiles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {profiles.map((p) => (
            <ProfileCard
              key={p.id}
              profile={p}
              onAnalyze={() => handleAnalyze(p)}
              onDelete={() => setProfileToDelete(p)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={InstagramIcon}
          title="No Social Profiles Found"
          description="Add your Instagram profile to begin analyzing your content niche, consistency, and format gaps."
          actionLabel="Create Profile"
          actionIcon={Plus}
          onAction={() => navigate('/profiles/new')}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(profileToDelete)}
        onClose={() => setProfileToDelete(null)}
        onConfirm={confirmDelete}
        title={`Delete @${profileToDelete?.username}?`}
        message="This will remove the profile along with its analyzed posts, content calendar, and recommendations."
        loading={deleting}
      />
    </div>
  );
}

export default Profiles;
