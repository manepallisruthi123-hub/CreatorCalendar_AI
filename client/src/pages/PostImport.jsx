import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Button } from '../components/common/Button';
import { Input, Textarea, Select } from '../components/common/Inputs';
import { Badge } from '../components/common/Badge';
import { Spinner } from '../components/common/Spinner';
import { useToast } from '../components/common/Toast';
import {
  Sparkles,
  Plus,
  Trash2,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Download,
  Info,
  Layers,
  Calendar,
  FileText
} from 'lucide-react';
import { InstagramIcon } from '../components/common/InstagramIcon';

export function PostImport() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeProfile, profiles, selectProfile, refreshProfiles } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('demo'); // 'demo' | 'manual' | 'csv'
  const [loading, setLoading] = useState(false);
  const [existingPosts, setExistingPosts] = useState([]);
  const [loadingExisting, setLoadingExisting] = useState(false);

  // Manual Multi-Post Form State
  const initialManualPost = {
    content_type: 'Carousel',
    post_date: new Date().toISOString().split('T')[0],
    caption: '',
    likes: '',
    comments: '',
    hashtags: '',
    cta: ''
  };
  const [manualPosts, setManualPosts] = useState([
    { ...initialManualPost, content_type: 'Carousel' },
    { ...initialManualPost, content_type: 'Reel' },
    { ...initialManualPost, content_type: 'Story' }
  ]);

  // CSV Import State
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState([]);
  const [csvError, setCsvError] = useState('');

  useEffect(() => {
    if (activeProfile?.id) {
      loadExistingPosts(activeProfile.id);
    }
  }, [activeProfile?.id]);

  const loadExistingPosts = async (profileId) => {
    setLoadingExisting(true);
    try {
      const res = await api.profilePosts.list(profileId);
      setExistingPosts(res.posts || []);
    } catch (err) {
      console.warn('Could not fetch existing posts:', err);
    } finally {
      setLoadingExisting(false);
    }
  };

  // Option A: Load Demo Posts
  const handleLoadDemoPosts = async () => {
    if (!activeProfile?.id) {
      toast.error('Please create or select a profile first');
      return;
    }
    setLoading(true);
    try {
      const res = await api.profilePosts.seedSample(activeProfile.id);
      toast.success(res.message || '10 realistic sample posts loaded!');
      await loadExistingPosts(activeProfile.id);
      await refreshProfiles();
      navigate('/posts');
    } catch (err) {
      toast.error(err.message || 'Failed to seed sample posts');
    } finally {
      setLoading(false);
    }
  };

  // Option B: Manual Multi-Post Handling
  const handleAddManualRow = () => {
    setManualPosts(prev => [
      ...prev,
      { ...initialManualPost, content_type: prev.length % 2 === 0 ? 'Carousel' : 'Reel' }
    ]);
  };

  const handleRemoveManualRow = (idx) => {
    if (manualPosts.length <= 1) return;
    setManualPosts(prev => prev.filter((_, i) => i !== idx));
  };

  const handleManualChange = (index, field, value) => {
    setManualPosts(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSaveManualPosts = async (e) => {
    e.preventDefault();
    if (!activeProfile?.id) {
      toast.error('Please select an active profile first');
      return;
    }

    // Filter rows that have at least a caption or content type
    const validRows = manualPosts.filter(p => p.caption.trim().length > 0);
    if (validRows.length === 0) {
      toast.error('Please enter a caption for at least one post before importing');
      return;
    }

    setLoading(true);
    try {
      const formatted = validRows.map(p => ({
        content_type: p.content_type,
        post_date: p.post_date || new Date().toISOString(),
        caption: p.caption,
        likes: parseInt(p.likes, 10) || 0,
        comments: parseInt(p.comments, 10) || 0,
        hashtags: p.hashtags
          ? p.hashtags.split(/[\s,]+/).filter(Boolean).map(t => t.startsWith('#') ? t : `#${t}`)
          : [],
        cta: p.cta || '',
        is_demo: false
      }));

      const res = await api.profilePosts.batchImport(activeProfile.id, formatted);
      toast.success(res.message || `Successfully imported ${formatted.length} posts!`);
      await loadExistingPosts(activeProfile.id);
      await refreshProfiles();
      navigate('/posts');
    } catch (err) {
      toast.error(err.message || 'Failed to save manual posts');
    } finally {
      setLoading(false);
    }
  };

  // Option C: CSV Parser & Preview
  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      throw new Error('CSV must contain a header row and at least one data row.');
    }

    // Split CSV line taking quotes into account
    const parseLine = (line) => {
      const result = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += char;
        }
      }
      result.push(cur.trim());
      return result;
    };

    const headers = parseLine(lines[0]).map(h => h.toLowerCase().trim());
    const expectedHeaders = ['content_type', 'caption'];
    const missing = expectedHeaders.filter(h => !headers.includes(h));
    if (missing.length > 0) {
      throw new Error(`CSV is missing required column: ${missing.join(', ')}. Expected: date,content_type,caption,likes,comments,hashtags,cta`);
    }

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = parseLine(lines[i]);
      if (vals.length === 0 || (vals.length === 1 && vals[0] === '')) continue;

      const row = {};
      headers.forEach((h, idx) => {
        row[h] = vals[idx] || '';
      });

      // Normalize content type
      let ct = row.content_type || 'Image';
      if (/reel/i.test(ct)) ct = 'Reel';
      else if (/carousel/i.test(ct)) ct = 'Carousel';
      else if (/story/i.test(ct)) ct = 'Story';
      else ct = 'Image';

      rows.push({
        post_date: row.date ? new Date(row.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        content_type: ct,
        caption: row.caption || '',
        likes: parseInt(row.likes, 10) || 0,
        comments: parseInt(row.comments, 10) || 0,
        hashtags: row.hashtags
          ? row.hashtags.split(/[\s,]+/).filter(Boolean).map(t => t.startsWith('#') ? t : `#${t}`)
          : [],
        cta: row.cta || '',
        is_demo: false,
        isValid: Boolean(row.caption && row.caption.trim().length > 0)
      });
    }

    return rows;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    setCsvError('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result;
        const parsed = parseCSV(text);
        setCsvPreview(parsed);
        if (parsed.length === 0) {
          setCsvError('No valid data rows found in CSV file.');
        }
      } catch (err) {
        setCsvError(err.message || 'Failed to parse CSV file');
        setCsvPreview([]);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmCsvImport = async () => {
    if (!activeProfile?.id) {
      toast.error('Please select an active profile first');
      return;
    }
    const validRows = csvPreview.filter(r => r.isValid);
    if (validRows.length === 0) {
      toast.error('No valid rows to import.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.profilePosts.batchImport(activeProfile.id, validRows);
      toast.success(res.message || `Imported ${validRows.length} posts from CSV!`);
      await loadExistingPosts(activeProfile.id);
      await refreshProfiles();
      navigate('/posts');
    } catch (err) {
      toast.error(err.message || 'Failed to import CSV posts');
    } finally {
      setLoading(false);
    }
  };

  const downloadSampleCSV = () => {
    const csvContent = [
      'date,content_type,caption,likes,comments,hashtags,cta',
      '2026-03-20,Carousel,"5 essential system architecture principles every fullstack developer should know.",245,18,"#coding,#tech,#architecture","Save this guide for later"',
      '2026-03-22,Reel,"How fast query indexing fixes 90% of production lag in PostgreSQL.",520,41,"#postgres,#database,#devtips","Comment INDEX for the cheat sheet"',
      '2026-03-24,Story,"Which language are you choosing for your 2026 backend projects?",95,35,"#community,#poll","Tap to vote in today poll"',
      '2026-03-26,Image,"Stop chasing every new frontend library. Master the fundamental core first.",310,22,"#mindset,#focus","Double tap if you agree"'
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_creator_posts.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!activeProfile && profiles.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mx-auto mb-4">
          <InstagramIcon className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-100">No Profile Connected Yet</h2>
        <p className="text-xs text-slate-400 mt-2 mb-6">
          Create or connect an Instagram profile before importing post history.
        </p>
        <Button variant="primary" onClick={() => navigate('/profiles/new')}>
          Connect Instagram Profile
        </Button>
      </div>
    );
  }

  const hasPosts = existingPosts.length > 0;
  const demoPostCount = existingPosts.filter(p => p.is_demo).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Notification Banner Required by Spec */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-brand-950/60 via-slate-900 to-indigo-950/60 border border-brand-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/40 text-brand-400 flex items-center justify-center shrink-0 mt-0.5">
            <InstagramIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-100">
                Instagram profile connected.
              </h1>
              <Badge variant="brand" size="sm">@{activeProfile?.username}</Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              Recent content wasn't available automatically. Choose an import option below.
            </p>
          </div>
        </div>

        {/* Action Button: Analyze My Content (enabled once posts exist) */}
        {hasPosts ? (
          <Button
            size="md"
            variant="primary"
            icon={Sparkles}
            onClick={() => navigate(`/profiles/${activeProfile.id}/analysis`)}
          >
            Analyze My Content ({existingPosts.length})
          </Button>
        ) : (
          <div className="text-xs text-slate-400 italic">
            Import posts to unlock AI analysis
          </div>
        )}
      </div>

      {/* Active Posts Counter & Status Badge if data already imported */}
      {hasPosts && (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-slate-200">
                {existingPosts.length} Recent Posts Currently Stored
              </p>
              <p className="text-[11px] text-slate-400">
                {demoPostCount > 0 ? (
                  <span className="text-amber-400 font-medium">Includes {demoPostCount} realistic demo posts</span>
                ) : (
                  <span>Custom imported creator content</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              icon={FileText}
              onClick={() => navigate('/posts')}
            >
              View Stored Posts
            </Button>
            <Button
              size="sm"
              variant="primary"
              icon={Sparkles}
              onClick={() => navigate(`/profiles/${activeProfile.id}/analysis`)}
            >
              Analyze My Content
            </Button>
          </div>
        </div>
      )}

      {/* 3 Import Cards Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card A: Load Demo Data */}
        <div
          onClick={() => setActiveTab('demo')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all flex flex-col justify-between ${
            activeTab === 'demo'
              ? 'bg-slate-900 border-brand-500 shadow-lg shadow-brand-500/10 ring-1 ring-brand-500'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <Badge variant="brand" size="sm">Instant 1-Click</Badge>
            </div>
            <h3 className="text-base font-bold text-slate-100">Load Demo Data</h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Explore CreatorCalendar with a realistic 10-post sample profile.
            </p>
            <ul className="mt-4 space-y-1.5 text-[11px] text-slate-400">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" />
                <span>10 authentic sample posts (Reels, Carousels, Stories)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" />
                <span>Clear CTAs, hashtags & realistic engagement</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" />
                <span>Visibly marked as demo data</span>
              </li>
            </ul>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-800">
            <Button
              variant={activeTab === 'demo' ? 'primary' : 'secondary'}
              className="w-full text-xs font-semibold"
              onClick={(e) => {
                e.stopPropagation();
                handleLoadDemoPosts();
              }}
              loading={loading && activeTab === 'demo'}
              icon={Sparkles}
            >
              Load Demo Posts
            </Button>
          </div>
        </div>

        {/* Card B: Add Posts Manually */}
        <div
          onClick={() => setActiveTab('manual')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all flex flex-col justify-between ${
            activeTab === 'manual'
              ? 'bg-slate-900 border-brand-500 shadow-lg shadow-brand-500/10 ring-1 ring-brand-500'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <Badge variant="neutral" size="sm">Custom Form</Badge>
            </div>
            <h3 className="text-base font-bold text-slate-100">Add Posts Manually</h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Enter your recent Instagram posts with format, metrics, and call-to-actions.
            </p>
            <ul className="mt-4 space-y-1.5 text-[11px] text-slate-400">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Multi-post batch entry (add 5-10 posts)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Reel, Carousel, Image, and Story formats</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Custom CTAs and exact metrics</span>
              </li>
            </ul>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-800">
            <Button
              variant={activeTab === 'manual' ? 'primary' : 'secondary'}
              className="w-full text-xs font-semibold"
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab('manual');
              }}
            >
              Add Posts Manually
            </Button>
          </div>
        </div>

        {/* Card C: Upload CSV */}
        <div
          onClick={() => setActiveTab('csv')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all flex flex-col justify-between ${
            activeTab === 'csv'
              ? 'bg-slate-900 border-brand-500 shadow-lg shadow-brand-500/10 ring-1 ring-brand-500'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <Badge variant="success" size="sm">Bulk Ingestion</Badge>
            </div>
            <h3 className="text-base font-bold text-slate-100">Upload CSV</h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Import past posts from any spreadsheet with validation and preview.
            </p>
            <ul className="mt-4 space-y-1.5 text-[11px] text-slate-400">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>date, content_type, caption, likes, comments, cta</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Interactive validation preview table</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Instant bulk import to PostgreSQL</span>
              </li>
            </ul>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-800">
            <Button
              variant={activeTab === 'csv' ? 'primary' : 'secondary'}
              className="w-full text-xs font-semibold"
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab('csv');
              }}
            >
              Upload CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Content Display Area */}
      {activeTab === 'demo' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="max-w-xl">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Option 1: Load 10 Realistic Demo Posts</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Explore CreatorCalendar immediately with a realistic 10-post sample profile. These posts include diverse formats (Reels, Carousels, and Stories), actual engagement rates, opening hooks, and audience CTAs.
            </p>
            <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Demo posts are visibly labeled as sample/demo data to ensure honest, transparent reporting.
              </span>
            </div>
            <div className="mt-6">
              <Button
                variant="primary"
                size="md"
                onClick={handleLoadDemoPosts}
                loading={loading}
                icon={Sparkles}
              >
                Load Demo Posts (10 Realistic Posts)
              </Button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'manual' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-800 gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-100">Option 2: Add Recent Posts Manually</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Add 5 to 10 of your recent posts to generate accurate heuristics.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={Plus}
              onClick={handleAddManualRow}
            >
              Add Another Post Row
            </Button>
          </div>

          <form onSubmit={handleSaveManualPosts} className="mt-6 space-y-6">
            {manualPosts.map((post, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">
                    Post #{idx + 1}
                  </span>
                  {manualPosts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveManualRow(idx)}
                      className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Remove post"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Select
                    label="Content Type"
                    value={post.content_type}
                    onChange={(e) => handleManualChange(idx, 'content_type', e.target.value)}
                    options={[
                      { value: 'Carousel', label: 'Carousel' },
                      { value: 'Reel', label: 'Reel' },
                      { value: 'Image', label: 'Image' },
                      { value: 'Story', label: 'Story' }
                    ]}
                  />

                  <Input
                    label="Posted Date"
                    type="date"
                    value={post.post_date}
                    onChange={(e) => handleManualChange(idx, 'post_date', e.target.value)}
                    required
                  />

                  <Input
                    label="Call to Action (CTA used)"
                    placeholder="e.g. Save for later, Link in bio"
                    value={post.cta}
                    onChange={(e) => handleManualChange(idx, 'cta', e.target.value)}
                  />
                </div>

                <Textarea
                  label="Caption & Hook"
                  rows={2}
                  placeholder="Enter the full post caption or opening hook..."
                  value={post.caption}
                  onChange={(e) => handleManualChange(idx, 'caption', e.target.value)}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    label="Likes"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={post.likes}
                    onChange={(e) => handleManualChange(idx, 'likes', e.target.value)}
                  />

                  <Input
                    label="Comments"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={post.comments}
                    onChange={(e) => handleManualChange(idx, 'comments', e.target.value)}
                  />

                  <Input
                    label="Hashtags (comma or space separated)"
                    placeholder="#coding, #tech, #design"
                    value={post.hashtags}
                    onChange={(e) => handleManualChange(idx, 'hashtags', e.target.value)}
                  />
                </div>
              </div>
            ))}

            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-slate-800 gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={Plus}
                onClick={handleAddManualRow}
              >
                Add Another Post
              </Button>

              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={loading}
                icon={CheckCircle2}
              >
                Save {manualPosts.filter(p => p.caption.trim().length > 0).length} Posts to Database
              </Button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'csv' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-800 gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-100">Option 3: Import via CSV</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Expected columns: <code className="text-brand-300 font-mono">date,content_type,caption,likes,comments,hashtags,cta</code>
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={Download}
              onClick={downloadSampleCSV}
            >
              Download Sample CSV
            </Button>
          </div>

          {/* Upload Dropzone */}
          <div className="border-2 border-dashed border-slate-700 hover:border-brand-500/60 rounded-2xl p-8 text-center transition-colors">
            <input
              type="file"
              id="csv-file-input"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileUpload}
            />
            <label htmlFor="csv-file-input" className="cursor-pointer flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-200">
                {csvFile ? csvFile.name : 'Click to select or drop your CSV file'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports UTF-8 CSV exports from Notion, Excel, or Google Sheets
              </p>
            </label>
          </div>

          {csvError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{csvError}</span>
            </div>
          )}

          {/* CSV Preview Table */}
          {csvPreview.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-200">
                  CSV Preview ({csvPreview.length} rows detected)
                </h4>
                <Badge variant="brand" size="sm">
                  {csvPreview.filter(r => r.isValid).length} Valid Rows
                </Badge>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Caption</th>
                      <th className="py-2.5 px-3">CTA</th>
                      <th className="py-2.5 px-3 text-right">Likes</th>
                      <th className="py-2.5 px-3 text-right">Comments</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/60 font-mono text-[11px]">
                    {csvPreview.map((row, idx) => (
                      <tr key={idx} className={row.isValid ? '' : 'bg-rose-500/5'}>
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-400">{row.post_date}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-brand-300 font-sans text-[10px] font-semibold">
                            {row.content_type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 max-w-[280px] truncate font-sans text-slate-200">
                          {row.caption || <span className="text-rose-400 italic font-mono">Missing caption</span>}
                        </td>
                        <td className="py-2.5 px-3 max-w-[150px] truncate font-sans text-slate-400">
                          {row.cta || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-300">{row.likes}</td>
                        <td className="py-2.5 px-3 text-right text-slate-300">{row.comments}</td>
                        <td className="py-2.5 px-3 text-center">
                          {row.isValid ? (
                            <span className="text-emerald-400 font-sans font-medium text-[10px]">Valid</span>
                          ) : (
                            <span className="text-rose-400 font-sans font-medium text-[10px]">Invalid</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-3">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleConfirmCsvImport}
                  loading={loading}
                  icon={CheckCircle2}
                >
                  Confirm & Import {csvPreview.filter(r => r.isValid).length} Posts to PostgreSQL
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PostImport;
