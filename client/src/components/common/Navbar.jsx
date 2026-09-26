import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Plus, ChevronDown } from 'lucide-react';
import { InstagramIcon } from './InstagramIcon';

export function Navbar({ onMenuToggle }) {
  const { activeProfile, profiles, selectProfile } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile Menu & Profile Selector */}
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="md:hidden p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        {/* Profile Selector Dropdown */}
        {profiles.length > 0 ? (
          <div className="relative group">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 cursor-pointer transition-all">
              <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-pink-500 to-amber-500 flex items-center justify-center text-white shrink-0">
                <InstagramIcon className="w-3 h-3" />
              </div>
              <span className="text-xs font-semibold text-slate-200 truncate max-w-[120px] sm:max-w-[180px]">
                @{activeProfile?.username || 'Select Profile'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>

            {/* Dropdown Menu */}
            <div className="absolute left-0 mt-1 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 hidden group-hover:block z-50">
              <div className="px-2.5 py-1.5 text-[10px] uppercase font-bold text-slate-400">
                Switch Profile
              </div>
              {profiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => selectProfile(p)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-left transition-colors ${
                    activeProfile?.id === p.id
                      ? 'bg-brand-600/20 text-brand-300 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/80'
                  }`}
                >
                  <span className="truncate">@{p.username}</span>
                  <span className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-800">{p.niche || 'Creator'}</span>
                </button>
              ))}
              <div className="mt-1 pt-1 border-t border-slate-800">
                <button
                  onClick={() => navigate('/profiles/new')}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-brand-400 hover:bg-brand-500/10 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Profile</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => navigate('/profiles/new')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-600/20 border border-brand-500/40 text-brand-300 text-xs font-medium hover:bg-brand-600/30 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Connect Instagram Profile</span>
          </button>
        )}
      </div>

      {/* Right: Quick Planning Status & Tagline */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-800/40 px-3 py-1.5 rounded-full border border-slate-800">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Social Profile Intelligence</span>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
