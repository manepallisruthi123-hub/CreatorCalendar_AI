import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Button } from '../components/common/Button';
import { Input, Textarea, Select } from '../components/common/Inputs';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { Spinner } from '../components/common/Spinner';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../components/common/Toast';
import {
  ArrowLeft,
  Sparkles,
  Plus,
  FileSpreadsheet,
  Upload,
  Trash2,
  ShieldAlert,
  Clock,
  ExternalLink
} from 'lucide-react';
import { InstagramIcon } from '../components/common/InstagramIcon';

export function ProfileDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectProfile } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Add Post Modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newPost, setNewPost] = useState({
    content_type: 'Carousel',
    caption: '',
    hashtags: '',
    likes: 0,
    comments: 0,
    views: 0,
    reach: 0,
    post_date: new Date().toISOString().split('T')[0]
  });
  const [savingPost, setSavingPost] = useState(false);

  // CSV Modal state
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importingCsv, setImportingCsv] = useState(false);

  useEffect(() => {
    fetchProfileAndPosts();
  }, [id]);

  const fetchProfileAndPosts = async () => {
    setLoading(true);
    try {
      const pRes = await api.profiles.get(id);
      setProfile(pRes.profile);
      selectProfile(pRes.profile);

      const postsRes = await api.profilePosts.list(id);
      setPosts(postsRes.posts || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load profile details');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedPosts = async () => {
    setSeeding(true);
    try {
      const res = await api.profilePosts.seedSample(id);
      toast.success(res.message || 'Sample creator posts loaded!');
      await fetchProfileAndPosts();
    } catch (err) {
      toast.error(err.message || 'Failed to seed sample posts');
    } finally {
      setSeeding(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setSavingPost(true);
    try {
      const tags = newPost.hashtags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)
        .map(t => (t.startsWith('#') ? t : `#${t}`));

      await api.profilePosts.create(id, {
        ...newPost,
        hashtags: tags,
        likes: Number(newPost.likes) || 0,
        comments: Number(newPost.comments) || 0,
        views: Number(newPost.views) || 0,
        reach: Number(newPost.reach) || 0
      });

      toast.success('Post added to corpus');
      setAddModalOpen(false);
      setNewPost({
        content_type: 'Carousel',
        caption: '',
        hashtags: '',
        likes: 0,
        comments: 0,
        views: 0,
        reach: 0,
        post_date: new Date().toISOString().split('T')[0]
      });
      await fetchProfileAndPosts();
    } catch (err) {
      toast.error(err.message || 'Failed to add post');
    } finally {
      setSavingPost(false);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await api.profilePosts.delete(postId);
      toast.success('Post removed from profile');
      setPosts(posts.filter(p => p.id !== postId));
    } catch (err) {
      toast.error(err.message || 'Failed to delete post');
    }
  };

  const handleCsvImport = async (e) => {
    e.preventDefault();
    if (!csvText.trim()) return;
    setImportingCsv(true);
    try {
      // Parse CSV lines: format,caption,hashtags,likes,comments
      const lines = csvText.trim().split('\n');
      const parsedPosts = [];

      lines.forEach((line, index) => {
        // Skip header if present
        if (index === 0 && line.toLowerCase().includes('content_type')) return;
        const parts = line.split(',');
        if (parts.length >= 2) {
          const type = parts[0]?.trim() || 'Static Post';
          const cap = parts[1]?.trim() || '';
          const tags = parts[2] ? parts[2].split(';').map(t => t.trim()) : [];
          const likes = parseInt(parts[3] || '0', 10);
          const comments = parseInt(parts[4] || '0', 10);
          parsedPosts.push({
            content_type: type,
            caption: cap,
            hashtags: tags,
            likes: isNaN(likes) ? 0 : likes,
            comments: isNaN(comments) ? 0 : comments
          });
        }
      });

      if (parsedPosts.length === 0) {
        throw new Error('No valid post rows found in CSV. Format: format,caption,hashtags,likes,comments');
      }

      await api.profilePosts.batchImport(id, parsedPosts);
      toast.success(`Imported ${parsedPosts.length} posts from CSV`);
      setCsvModalOpen(false);
      setCsvText('');
      await fetchProfileAndPosts();
    } catch (err) {
      toast.error(err.message || 'Failed to parse CSV');
    } finally {
      setImportingCsv(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (posts.length === 0) {
      toast.error('Please add at least 1 post or load sample posts before analyzing.');
      return;
    }
    setAnalyzing(true);
    try {
      await api.analysis.trigger(id);
      toast.success('Analysis complete! Redirecting to intelligence report...');
      navigate(`/profiles/${id}/analysis`);
    } catch (err) {
      toast.error(err.message || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Spinner size="lg" />
        <p className="text-xs text-slate-400">Loading profile data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/profiles')}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-100">@{profile.username}</h1>
              <Badge variant="brand" size="sm">{profile.platform}</Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {profile.niche} • {profile.target_audience} • {profile.preferred_tone}
            </p>
          </div>
        </div>

        {/* Primary Analysis Trigger */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            icon={Sparkles}
            onClick={handleRunAnalysis}
            loading={analyzing}
            disabled={posts.length === 0}
          >
            Analyze Profile ({posts.length} Posts)
          </Button>
        </div>
      </div>

      {/* Mandatory Ingestion Notice (Section 3 Requirement) */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-amber-200">Social-Profile Ingestion Status</h4>
          <p className="mt-1 text-slate-300 leading-relaxed">
            Automatic profile data is unavailable without third-party platform authorization. Add your recent post details or upload analytics data to continue the analysis. Never fabricate Instagram data.
          </p>
        </div>
      </div>

      {/* Ingestion Action Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-300">
            Profile Post Corpus: <strong className="text-brand-400 font-bold">{posts.length} posts</strong>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            icon={Sparkles}
            onClick={handleSeedPosts}
            loading={seeding}
          >
            Load 10 Realistic Creator Posts
          </Button>

          <Button
            size="sm"
            variant="outline"
            icon={FileSpreadsheet}
            onClick={() => setCsvModalOpen(true)}
          >
            Import CSV
          </Button>

          <Button
            size="sm"
            variant="primary"
            icon={Plus}
            onClick={() => setAddModalOpen(true)}
          >
            Add Post Manually
          </Button>
        </div>
      </div>

      {/* Posts List / Table */}
      {posts.length > 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-100">Ingested Posts for Analysis</h3>
            <span className="text-xs text-slate-400">{posts.length} records available</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3">Format</th>
                  <th className="px-6 py-3">Caption Preview</th>
                  <th className="px-6 py-3">Hashtags</th>
                  <th className="px-6 py-3">Likes</th>
                  <th className="px-6 py-3">Comments</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-slate-200">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                        {post.content_type}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-300 max-w-xs truncate">
                      {post.caption || '(No caption)'}
                    </td>
                    <td className="px-6 py-3.5 text-slate-400 max-w-[150px] truncate">
                      {Array.isArray(post.hashtags) ? post.hashtags.join(' ') : ''}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-slate-300">{post.likes || 0}</td>
                    <td className="px-6 py-3.5 font-mono text-slate-300">{post.comments || 0}</td>
                    <td className="px-6 py-3.5 text-slate-400">
                      {post.post_date ? new Date(post.post_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                        title="Delete post"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={InstagramIcon}
          title="No Recent Posts Ingested"
          description="Click 'Load 10 Realistic Creator Posts' to instantly populate demo data, or add your actual recent post copy and metrics manually."
          actionLabel="Load 10 Realistic Creator Posts"
          actionIcon={Sparkles}
          onAction={handleSeedPosts}
        />
      )}

      {/* Add Post Manually Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Post Manually"
        subtitle="Provide actual recent post caption and available metrics"
      >
        <form onSubmit={handleCreatePost} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Format"
              value={newPost.content_type}
              onChange={(e) => setNewPost({ ...newPost, content_type: e.target.value })}
              options={[
                { value: 'Carousel', label: 'Carousel' },
                { value: 'Reel', label: 'Reel' },
                { value: 'Story', label: 'Story' },
                { value: 'Static Post', label: 'Static Post' },
              ]}
            />
            <Input
              label="Post Date"
              type="date"
              value={newPost.post_date}
              onChange={(e) => setNewPost({ ...newPost, post_date: e.target.value })}
            />
          </div>

          <Textarea
            label="Caption"
            rows={4}
            placeholder="Paste your caption here..."
            value={newPost.caption}
            onChange={(e) => setNewPost({ ...newPost, caption: e.target.value })}
            required
          />

          <Input
            label="Hashtags (comma separated)"
            placeholder="#tech, #learning, #coding"
            value={newPost.hashtags}
            onChange={(e) => setNewPost({ ...newPost, hashtags: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Likes (Optional)"
              type="number"
              value={newPost.likes}
              onChange={(e) => setNewPost({ ...newPost, likes: e.target.value })}
            />
            <Input
              label="Comments (Optional)"
              type="number"
              value={newPost.comments}
              onChange={(e) => setNewPost({ ...newPost, comments: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <Button variant="secondary" size="sm" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={savingPost}>
              Add to Corpus
            </Button>
          </div>
        </form>
      </Modal>

      {/* CSV Import Modal */}
      <Modal
        isOpen={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        title="Import Posts from CSV"
        subtitle="Paste CSV text. Columns: format,caption,hashtags,likes,comments"
      >
        <form onSubmit={handleCsvImport} className="space-y-4">
          <Textarea
            label="CSV Content"
            rows={6}
            placeholder="Carousel,5 clean code tips for beginners,#cleancode;#dev,240,18&#10;Reel,Debugging in production on a Friday,#devhumor,580,45"
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            required
          />

          <p className="text-[11px] text-slate-400">
            Format: <code className="text-slate-300">content_type,caption,hashtags,likes,comments</code>
          </p>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <Button variant="secondary" size="sm" onClick={() => setCsvModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={importingCsv}>
              Parse & Import
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default ProfileDetails;
