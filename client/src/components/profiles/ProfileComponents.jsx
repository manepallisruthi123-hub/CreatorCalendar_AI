import React from 'react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Clock, ExternalLink, Sparkles, BarChart2, ShieldAlert } from 'lucide-react';
import { InstagramIcon } from '../common/InstagramIcon';
import { useNavigate } from 'react-router-dom';

export function ProfileCard({ profile, onAnalyze, onDelete }) {
  const navigate = useNavigate();

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-pink-500/20">
              <InstagramIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-base font-bold text-slate-100">@{profile.username}</h4>
                <a
                  href={profile.profile_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-slate-200"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <p className="text-xs text-brand-400 font-medium">{profile.niche || 'General Creator'}</p>
            </div>
          </div>
          <Badge variant="brand" size="sm">{profile.platform}</Badge>
        </div>

        {/* Details Grid */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-[11px] text-slate-400 block">Target Audience</span>
            <span className="text-slate-300 font-medium truncate block">{profile.target_audience || 'Not set'}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Goal</span>
            <span className="text-slate-300 font-medium truncate block">{profile.content_goal || 'Growth'}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Tone</span>
            <span className="text-slate-300 font-medium truncate block">{profile.preferred_tone || 'Friendly'}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Analyzed Posts</span>
            <span className="text-slate-300 font-semibold">{profile.post_count || 0} posts</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => navigate(`/profiles/${profile.id}`)}
        >
          View Data ({profile.post_count || 0})
        </Button>
        <Button
          size="sm"
          variant="primary"
          icon={Sparkles}
          onClick={() => onAnalyze ? onAnalyze(profile) : navigate(`/profiles/${profile.id}/analysis`)}
        >
          Analyze Profile
        </Button>
      </div>
    </div>
  );
}

export function ContentMixChart({ mix = [] }) {
  const colors = [
    { bg: 'bg-brand-500', text: 'text-brand-400' },
    { bg: 'bg-indigo-500', text: 'text-indigo-400' },
    { bg: 'bg-pink-500', text: 'text-pink-400' },
    { bg: 'bg-emerald-500', text: 'text-emerald-400' },
    { bg: 'bg-amber-500', text: 'text-amber-400' },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
      <h4 className="text-sm font-semibold text-slate-100 mb-3 flex items-center gap-2">
        <BarChart2 className="w-4 h-4 text-brand-400" />
        Content Format Mix
      </h4>

      {/* Stacked Progress Bar */}
      <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex mb-4">
        {mix.map((item, idx) => (
          <div
            key={idx}
            className={`${colors[idx % colors.length].bg} h-full transition-all duration-500`}
            style={{ width: `${item.percentage}%` }}
            title={`${item.content_type}: ${item.percentage}%`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {mix.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-800/80 text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${colors[idx % colors.length].bg}`}></span>
              <span className="text-slate-300 font-medium">{item.content_type}</span>
            </div>
            <span className={`font-bold ${colors[idx % colors.length].text}`}>{item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ThemeChart({ themes = [] }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
      <h4 className="text-sm font-semibold text-slate-100 mb-3 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-400" />
        Thematic Topic Distribution
      </h4>

      <div className="space-y-3">
        {themes.map((t, idx) => (
          <div key={idx}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-300 font-medium">{t.theme}</span>
              <span className="text-slate-400 font-bold">{t.percentage}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-brand-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${t.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PostingWindowCard({ windows = [] }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" />
            Recommended Posting Windows
          </h4>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0" />
            Planning recommendations based on audience & timezone. Never guaranteed.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {windows.map((win, idx) => (
          <div key={idx} className="bg-slate-800/40 border border-slate-800 p-3.5 rounded-xl">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-200">{win.day}</span>
              <Badge variant={win.confidence === 'HIGH' ? 'success' : win.confidence === 'MEDIUM' ? 'brand' : 'default'} size="sm">
                {win.confidence} Confidence
              </Badge>
            </div>
            <div className="text-sm font-extrabold text-sky-400 mb-1.5">
              {win.start} - {win.end}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">{win.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
