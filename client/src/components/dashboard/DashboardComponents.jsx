import React from 'react';
import { Badge } from '../common/Badge';
import { CheckCircle2, AlertTriangle, Lightbulb, ArrowUpRight, Clock, Calendar as CalendarIcon, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ProfileHealthCard({ health }) {
  const indicators = [
    { label: 'Content Consistency', value: health?.consistency, color: 'text-indigo-400', bar: 'bg-indigo-500' },
    { label: 'Content Variety', value: health?.variety, color: 'text-amber-400', bar: 'bg-amber-500' },
    { label: 'Brand Clarity', value: health?.brand_clarity, color: 'text-emerald-400', bar: 'bg-emerald-500' },
    { label: 'Caption Quality', value: health?.caption_quality, color: 'text-sky-400', bar: 'bg-sky-500' },
    { label: 'CTA Usage', value: health?.cta_usage, color: 'text-rose-400', bar: 'bg-rose-500' },
    { label: 'Format Consistency', value: health?.format_consistency, color: 'text-purple-400', bar: 'bg-purple-500' },
  ];

  const modeBadge = health?.analysis_mode === 'STARTER_STRATEGY'
    ? 'Starter Strategy'
    : (health?.analysis_mode === 'EARLY_CONTENT' ? 'Limited Historical Data' : 'Planning Heuristics');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-100">Profile Health</h3>
            <Badge variant="brand" size="sm">{modeBadge}</Badge>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <Info className="w-3 h-3 text-slate-400 shrink-0" />
            AI-derived planning indicators. Grounded strictly in available post corpus.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {indicators.map((ind) => {
          const hasValue = ind.value !== null && ind.value !== undefined;
          return (
            <div key={ind.label} className="bg-slate-800/40 border border-slate-800 p-3.5 rounded-xl">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-400 font-medium truncate">{ind.label}</span>
                <span className={`font-bold ${hasValue ? ind.color : 'text-slate-500'}`}>
                  {hasValue ? `${ind.value}%` : '—'}
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${hasValue ? ind.bar : 'bg-transparent'}`}
                  style={{ width: `${hasValue ? ind.value : 0}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function StatCard({ title, value, subtitle, icon: Icon, color = 'brand' }) {
  const colors = {
    brand: 'text-brand-400 bg-brand-500/10 border-brand-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    sky: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-slate-400">{title}</p>
        <h4 className="text-2xl font-bold text-slate-100 mt-1">{value}</h4>
        {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {Icon && (
        <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
}

export function StrengthCard({ strengths = [] }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
      <div className="flex items-center gap-2 mb-3.5">
        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-semibold text-slate-100">What’s Working</h3>
      </div>
      <div className="space-y-3">
        {strengths.length > 0 ? (
          strengths.slice(0, 3).map((item, idx) => (
            <div key={idx} className="bg-slate-800/40 border border-slate-800/80 p-3 rounded-xl">
              <h5 className="text-xs font-semibold text-emerald-300">{item.title}</h5>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{item.description}</p>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-400 py-3 text-center">Analyze your profile to reveal proven strengths.</p>
        )}
      </div>
    </div>
  );
}

export function WeaknessCard({ weaknesses = [] }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
      <div className="flex items-center gap-2 mb-3.5">
        <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-semibold text-slate-100">What Could Improve</h3>
      </div>
      <div className="space-y-3">
        {weaknesses.length > 0 ? (
          weaknesses.slice(0, 3).map((item, idx) => (
            <div key={idx} className="bg-slate-800/40 border border-slate-800/80 p-3 rounded-xl">
              <h5 className="text-xs font-semibold text-amber-300">{item.title}</h5>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{item.description}</p>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-400 py-3 text-center">Analyze your profile to identify creative bottlenecks.</p>
        )}
      </div>
    </div>
  );
}

export function OpportunityCard({ opportunities = [] }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
      <div className="flex items-center gap-2 mb-3.5">
        <div className="w-7 h-7 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center">
          <Lightbulb className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-semibold text-slate-100">Content Opportunities</h3>
      </div>
      <div className="space-y-3">
        {opportunities.length > 0 ? (
          opportunities.slice(0, 3).map((item, idx) => (
            <div key={idx} className="bg-slate-800/40 border border-slate-800/80 p-3 rounded-xl flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h5 className="text-xs font-semibold text-brand-300">{item.title}</h5>
                  <Badge variant={item.priority === 'HIGH' ? 'danger' : 'brand'} size="sm">
                    {item.priority}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{item.action || item.description}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-400 py-3 text-center">Unlock strategic opportunities from your profile analysis.</p>
        )}
      </div>
    </div>
  );
}

export function RecommendationCard({ recommendations = [], onStatusChange }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-100">Top Strategic Recommendations</h3>
          <Badge variant="brand" size="sm">Action Items</Badge>
        </div>
      </div>
      <div className="space-y-3">
        {recommendations.length > 0 ? (
          recommendations.map((rec) => (
            <div key={rec.id} className="bg-slate-800/40 border border-slate-800 p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={rec.priority === 'HIGH' ? 'danger' : rec.priority === 'MEDIUM' ? 'warning' : 'default'} size="sm">
                    {rec.priority}
                  </Badge>
                  <h4 className="text-xs font-semibold text-slate-200">{rec.title}</h4>
                </div>
                <p className="text-[11px] text-slate-400">{rec.action || rec.description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={rec.status}
                  onChange={(e) => onStatusChange && onStatusChange(rec.id, e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-[11px] text-slate-300 rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-brand-500"
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="DISMISSED">Dismissed</option>
                </select>
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-400 py-4 text-center">No active recommendations. Run profile analysis to generate.</p>
        )}
      </div>
    </div>
  );
}

export function UpcomingPosts({ posts = [] }) {
  const navigate = useNavigate();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-brand-400" />
          Upcoming Content
        </h3>
        <button
          onClick={() => navigate('/calendar')}
          className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1"
        >
          View Calendar <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-2.5">
        {posts.length > 0 ? (
          posts.map((post) => (
            <div
              key={post.id}
              onClick={() => navigate(`/posts/${post.id}`)}
              className="bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800 p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-9 h-9 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-300 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[9px] uppercase font-bold text-slate-400 leading-none">
                    {new Date(post.scheduled_date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <span className="text-xs font-extrabold text-slate-100 leading-none mt-0.5">
                    {new Date(post.scheduled_date).getDate()}
                  </span>
                </div>
                <div className="overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                      {post.content_type}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {post.suggested_time}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-200 truncate mt-1">{post.topic}</h4>
                </div>
              </div>

              <Badge
                variant={post.status === 'SCHEDULED' ? 'success' : post.status === 'PUBLISHED' ? 'info' : 'warning'}
                size="sm"
              >
                {post.status}
              </Badge>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-400 py-4 text-center">No upcoming posts. Generate a 7-day content plan to fill your schedule.</p>
        )}
      </div>
    </div>
  );
}
