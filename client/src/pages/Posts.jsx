import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Button } from '../components/common/Button';
import { Input, Select } from '../components/common/Inputs';
import { Badge } from '../components/common/Badge';
import { Spinner } from '../components/common/Spinner';
import { EmptyState } from '../components/common/EmptyState';
import { PostEditorModal, RegeneratePostModal, PostStatusBadge } from '../components/posts/PostComponents';
import { useToast } from '../components/common/Toast';
import {
  FileText,
  Search,
  Filter,
  Plus,
  Sparkles,
  Clock,
  Trash2,
  Edit3,
  ExternalLink
} from 'lucide-react';

export function Posts() {
  const navigate = useNavigate();
  const { activeProfile } = useAuth();
  const toast = useToast();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals
  const [editingPost, setEditingPost] = useState(null);
  const [regeneratingPost, setRegeneratingPost] = useState(null);

  useEffect(() => {
    if (activeProfile?.id) {
      loadPosts();
    } else {
      setLoading(false);
    }
  }, [activeProfile?.id, statusFilter, typeFilter]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const filters = {
        profile_id: activeProfile?.id,
        status: statusFilter || undefined,
        content_type: typeFilter || undefined,
        search: search || undefined
      };
      const res = await api.posts.list(filters);
      setPosts(res.posts || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadPosts();
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
      toast.success('Post deleted');
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      toast.error(err.message || 'Failed to delete post');
    }
  };

  if (!activeProfile) {
    return (
      <EmptyState
        icon={FileText}
        title="No Profile Selected"
        description="Select or add a profile to manage posts."
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
            <h1 className="text-xl font-bold text-slate-100">All Content Posts</h1>
            <Badge variant="brand" size="sm">@{activeProfile.username}</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Search, filter, edit, and manage publish status across your content pipeline
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => {
            setEditingPost({
              profile_id: activeProfile.id,
              scheduled_date: new Date().toISOString().split('T')[0],
              topic: '',
              hook: '',
              caption: '',
              content_type: 'Reel',
              status: 'DRAFT',
              suggested_time: '19:00',
              cta: ''
            });
          }}
        >
          Create Post
        </Button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search topics, hooks, or captions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </form>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-brand-500"
          >
            <option value="">All Formats</option>
            <option value="Reel">Reels</option>
            <option value="Carousel">Carousels</option>
            <option value="Story">Stories</option>
            <option value="Static Post">Static Posts</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-brand-500"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Posts Table / Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Spinner size="lg" />
          <p className="text-xs text-slate-400">Loading posts...</p>
        </div>
      ) : posts.length > 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3">Scheduled Date</th>
                  <th className="px-5 py-3">Format</th>
                  <th className="px-5 py-3">Topic & Hook</th>
                  <th className="px-5 py-3">Goal</th>
                  <th className="px-5 py-3">Time</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-slate-300 whitespace-nowrap">
                      {new Date(post.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 border border-slate-700 text-slate-300">
                        {post.content_type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 max-w-sm">
                      <h4
                        onClick={() => navigate(`/posts/${post.id}`)}
                        className="font-bold text-slate-100 hover:text-brand-300 cursor-pointer truncate"
                      >
                        {post.topic}
                      </h4>
                      {post.hook && (
                        <p className="text-[11px] text-slate-400 italic truncate mt-0.5">
                          "{post.hook}"
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-300">{post.goal}</td>
                    <td className="px-5 py-3.5 text-slate-400 font-mono whitespace-nowrap flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {post.suggested_time}
                    </td>
                    <td className="px-5 py-3.5">
                      <select
                        value={post.status}
                        onChange={(e) => handleStatusChange(post.id, e.target.value)}
                        className="bg-slate-800 text-[11px] text-slate-300 rounded px-2 py-1 border border-slate-700 focus:outline-none"
                      >
                        <option value="DRAFT">DRAFT</option>
                        <option value="SCHEDULED">SCHEDULED</option>
                        <option value="PUBLISHED">PUBLISHED</option>
                        <option value="ARCHIVED">ARCHIVED</option>
                      </select>
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setRegeneratingPost(post)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-300 hover:bg-slate-800"
                          title="Regenerate with AI"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingPost(post)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                          title="Edit post"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                          title="Delete post"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="No Posts Match Filters"
          description="Try clearing your search query or filters, or generate a 7-day content plan to populate your schedule."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearch('');
            setStatusFilter('');
            setTypeFilter('');
          }}
        />
      )}

      {/* Edit Modal */}
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

      {/* AI Regenerate Modal */}
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

export default Posts;
