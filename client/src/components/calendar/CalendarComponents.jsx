import React from 'react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Clock, Plus, Sparkles, Edit3, Trash2, CheckCircle2 } from 'lucide-react';

export function CalendarPostCard({ post, onEdit, onRegenerate, onStatusChange, onDelete }) {
  const formatColors = {
    Reel: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
    Carousel: 'bg-brand-500/15 text-brand-300 border-brand-500/30',
    Story: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    'Static Post': 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  };

  const statusVariants = {
    DRAFT: 'warning',
    SCHEDULED: 'brand',
    PUBLISHED: 'success',
    ARCHIVED: 'default'
  };

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 shadow-md transition-all flex flex-col justify-between group">
      <div>
        <div className="flex items-center justify-between gap-1 mb-2">
          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${
            formatColors[post.content_type] || 'bg-slate-800 text-slate-300 border-slate-700'
          }`}>
            {post.content_type}
          </span>
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {post.suggested_time}
          </span>
        </div>

        <h5
          onClick={() => onEdit(post)}
          className="text-xs font-bold text-slate-100 line-clamp-2 hover:text-brand-300 cursor-pointer transition-colors"
        >
          {post.topic}
        </h5>

        {post.hook && (
          <p className="text-[11px] text-slate-400 mt-1 italic line-clamp-2">
            "{post.hook}"
          </p>
        )}
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <select
          value={post.status}
          onChange={(e) => onStatusChange && onStatusChange(post.id, e.target.value)}
          className="bg-slate-800 text-[10px] text-slate-300 rounded px-1.5 py-0.5 border border-slate-700 focus:outline-none"
        >
          <option value="DRAFT">DRAFT</option>
          <option value="SCHEDULED">SCHEDULED</option>
          <option value="PUBLISHED">PUBLISHED</option>
          <option value="ARCHIVED">ARCHIVED</option>
        </select>

        <div className="flex items-center gap-1">
          {onRegenerate && (
            <button
              onClick={() => onRegenerate(post)}
              title="Regenerate this post with AI"
              className="p-1 rounded text-slate-400 hover:text-brand-300 hover:bg-slate-800 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => onEdit(post)}
            title="Edit post"
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          {onDelete && (
            <button
              onClick={() => onDelete(post.id)}
              title="Delete post"
              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function CalendarDay({ dayName, dateStr, posts = [], onAddPost, onEditPost, onRegeneratePost, onStatusChange, onDeletePost }) {
  const isToday = new Date().toISOString().split('T')[0] === dateStr;

  return (
    <div className={`flex flex-col bg-slate-900/60 border rounded-2xl overflow-hidden min-h-[420px] ${
      isToday ? 'border-brand-500/60 ring-1 ring-brand-500/40' : 'border-slate-800'
    }`}>
      {/* Day Header */}
      <div className={`p-3 border-b flex items-center justify-between ${
        isToday ? 'bg-brand-600/10 border-brand-500/30' : 'bg-slate-900 border-slate-800'
      }`}>
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
            {dayName}
          </span>
          <span className="text-[11px] text-slate-400">
            {dateStr ? new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
          </span>
        </div>
        {onAddPost && (
          <button
            onClick={() => onAddPost(dateStr)}
            title="Add post for this day"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Post cards in this day */}
      <div className="flex-1 p-2.5 space-y-2.5 overflow-y-auto">
        {posts.length > 0 ? (
          posts.map((post) => (
            <CalendarPostCard
              key={post.id}
              post={post}
              onEdit={onEditPost}
              onRegenerate={onRegeneratePost}
              onStatusChange={onStatusChange}
              onDelete={onDeletePost}
            />
          ))
        ) : (
          <div className="h-full flex items-center justify-center p-4">
            <span className="text-[11px] text-slate-400 text-center">No posts scheduled</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function WeeklyCalendar({ days = [], postsByDate = {}, onAddPost, onEditPost, onRegeneratePost, onStatusChange, onDeletePost }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
      {days.map((d) => (
        <CalendarDay
          key={d.date}
          dayName={d.day}
          dateStr={d.date}
          posts={postsByDate[d.date] || []}
          onAddPost={onAddPost}
          onEditPost={onEditPost}
          onRegeneratePost={onRegeneratePost}
          onStatusChange={onStatusChange}
          onDeletePost={onDeletePost}
        />
      ))}
    </div>
  );
}
