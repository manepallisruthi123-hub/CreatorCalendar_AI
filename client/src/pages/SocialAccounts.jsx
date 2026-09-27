import React, { useState, useEffect } from 'react';
import {
  Share2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Trash2,
  Key,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../components/common/Toast';
import {
  InstagramIcon,
  YouTubeIcon,
  TikTokIcon,
  LinkedInIcon,
  FacebookIcon
} from '../components/common/PlatformIcons';

export function SocialAccounts() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [platforms, setPlatforms] = useState([]);
  const [actionLoading, setActionLoading] = useState({});
  const [demoModalPlatform, setDemoModalPlatform] = useState(null);
  const [demoUsername, setDemoUsername] = useState('');
  const [demoDisplayName, setDemoDisplayName] = useState('');

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/social/accounts');
      const data = res?.data || res;
      setPlatforms(data.platforms || []);
    } catch (err) {
      addToast(err.response?.data?.message || err.message || 'Failed to load social accounts status', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleConnect = async (platformKey) => {
    try {
      setActionLoading(prev => ({ ...prev, [platformKey]: true }));
      const res = await api.post(`/social/connect/${platformKey}`, {
        redirectUri: window.location.origin + '/accounts'
      });
      const data = res?.data || res;

      if (data.status === 'OAUTH_REDIRECT' && data.authUrl) {
        window.location.href = data.authUrl;
        return;
      }

      if (data.status === 'CONNECTED') {
        addToast(data.message || `Connected to ${platformKey} successfully!`, 'success');
        await fetchAccounts();
      } else if (data.status === 'NOT_CONFIGURED') {
        // Open quick sandbox/demo connection modal so user can test seamlessly
        setDemoModalPlatform(platformKey);
        setDemoUsername(`${platformKey}_creator`);
        setDemoDisplayName(`${platformKey.charAt(0).toUpperCase() + platformKey.slice(1)} Creator`);
      }
    } catch (err) {
      // If unconfigured or unavailable, open sandbox connect modal to allow testing
      if (err.response?.data?.status === 'NOT_CONFIGURED' || err.response?.status === 400) {
        setDemoModalPlatform(platformKey);
        setDemoUsername(`${platformKey}_creator`);
        setDemoDisplayName(`${platformKey.charAt(0).toUpperCase() + platformKey.slice(1)} Creator`);
      } else {
        addToast(err.response?.data?.message || `Failed to initiate ${platformKey} connection`, 'error');
      }
    } finally {
      setActionLoading(prev => ({ ...prev, [platformKey]: false }));
    }
  };

  const handleSandboxConnect = async (e) => {
    e.preventDefault();
    if (!demoModalPlatform) return;
    try {
      setActionLoading(prev => ({ ...prev, [demoModalPlatform]: true }));
      const res = await api.post(`/social/connect/${demoModalPlatform}`, {
        isDemo: true,
        username: demoUsername,
        displayName: demoDisplayName,
        profileUrl: `https://${demoModalPlatform}.com/${demoUsername}`
      });
      const data = res?.data || res;
      addToast(data.message || `${demoModalPlatform} connected (Sandbox mode)`, 'success');
      setDemoModalPlatform(null);
      await fetchAccounts();
    } catch (err) {
      addToast(err.response?.data?.message || err.message || 'Failed to connect in sandbox mode', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [demoModalPlatform]: false }));
    }
  };

  const handleDisconnect = async (platformKey) => {
    if (!window.confirm(`Are you sure you want to disconnect ${platformKey}?`)) return;
    try {
      setActionLoading(prev => ({ ...prev, [platformKey]: true }));
      const res = await api.post(`/social/disconnect/${platformKey}`);
      const data = res?.data || res;
      addToast(data.message || 'Account disconnected', 'info');
      await fetchAccounts();
    } catch (err) {
      addToast(err.response?.data?.message || err.message || 'Failed to disconnect account', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [platformKey]: false }));
    }
  };

  const getPlatformIcon = (key) => {
    switch (key.toLowerCase()) {
      case 'instagram':
        return <InstagramIcon className="w-6 h-6 text-pink-400" />;
      case 'youtube':
        return <YouTubeIcon className="w-6 h-6 text-rose-500" />;
      case 'tiktok':
        return <TikTokIcon className="w-6 h-6 text-cyan-400" />;
      case 'linkedin':
        return <LinkedInIcon className="w-6 h-6 text-blue-400" />;
      case 'facebook':
        return <FacebookIcon className="w-6 h-6 text-blue-500" />;
      default:
        return <Share2 className="w-6 h-6 text-purple-400" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONNECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Connected
          </span>
        );
      case 'NOT_CONFIGURED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Key className="w-3.5 h-3.5" /> API Keys Needed
          </span>
        );
      case 'API_UNAVAILABLE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3.5 h-3.5" /> API Unavailable
          </span>
        );
      case 'NO_CONTENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            No Recent Content
          </span>
        );
      case 'NOT_CONNECTED':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            Not Connected
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Share2 className="w-6 h-6 text-brand-400" /> Connect Social Accounts
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Connect your official social media channels to enable multi-platform scheduling, AI adaptations, and content syncing.
          </p>
        </div>
        <button
          onClick={fetchAccounts}
          disabled={loading}
          className="btn-secondary text-xs flex items-center gap-1.5 self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Status
        </button>
      </div>

      {/* Security notice */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-200">Strict Official API Compliance:</span> CreatorCalendar AI connects exclusively via official platform APIs and OAuth 2.0. We never perform unauthorized scraping, guess private data, or store passwords.
        </div>
      </div>

      {/* Platform Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse p-6"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {platforms.map((p) => {
            const isConn = p.connected && p.status === 'CONNECTED';
            const isBusy = actionLoading[p.platform];

            return (
              <div
                key={p.platform}
                className="flex flex-col justify-between p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all shadow-lg"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center shadow-inner">
                        {getPlatformIcon(p.platform)}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-base">{p.displayName}</h3>
                        <p className="text-xs text-slate-400 capitalize">{p.platform} API</p>
                      </div>
                    </div>
                    {getStatusBadge(p.status)}
                  </div>

                  {/* Body Info */}
                  <div className="my-4 text-xs">
                    {isConn && p.account ? (
                      <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Account:</span>
                          <span className="font-semibold text-slate-200 truncate max-w-[150px]">
                            @{p.account.username || 'user'}
                          </span>
                        </div>
                        {p.account.displayName && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Display Name:</span>
                            <span className="text-slate-300 truncate max-w-[150px]">{p.account.displayName}</span>
                          </div>
                        )}
                        {p.account.profileUrl && (
                          <div className="pt-1 flex items-center justify-end">
                            <a
                              href={p.account.profileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-brand-400 hover:text-brand-300 flex items-center gap-1 font-medium"
                            >
                              View Profile <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-slate-400 leading-relaxed min-h-[48px]">
                        {p.message || `Connect your ${p.displayName} channel to generate platform-native formats.`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center gap-2">
                  {isConn ? (
                    <>
                      <button
                        onClick={() => handleDisconnect(p.platform)}
                        disabled={isBusy}
                        className="btn-secondary w-full text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Disconnect
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleConnect(p.platform)}
                        disabled={isBusy}
                        className="btn-primary w-full text-xs flex items-center justify-center gap-1.5"
                      >
                        {isBusy ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        {p.status === 'NOT_CONFIGURED' ? 'Connect / Sandbox' : `Connect ${p.displayName}`}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sandbox Connect Modal */}
      {demoModalPlatform && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-400" />
              Connect {demoModalPlatform.charAt(0).toUpperCase() + demoModalPlatform.slice(1)} (Sandbox Mode)
            </h3>
            <p className="text-xs text-slate-400 mt-2">
              Official API keys are not yet configured in <code className="text-purple-300">server/.env</code>.
              You can connect in Sandbox Mode to test the full multi-platform calendar and AI features immediately.
            </p>

            <form onSubmit={handleSandboxConnect} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Channel / Username Handle
                </label>
                <input
                  type="text"
                  required
                  value={demoUsername}
                  onChange={(e) => setDemoUsername(e.target.value)}
                  className="input-field w-full text-xs"
                  placeholder="e.g. tech_creator"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={demoDisplayName}
                  onChange={(e) => setDemoDisplayName(e.target.value)}
                  className="input-field w-full text-xs"
                  placeholder="e.g. Tech Explorer"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDemoModalPlatform(null)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading[demoModalPlatform]}
                  className="btn-primary text-xs flex items-center gap-1.5"
                >
                  Confirm Connection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SocialAccounts;
