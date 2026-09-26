import React from 'react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Lightbulb, Sparkles, Plus, Copy, Check, ArrowRight } from 'lucide-react';
import { useState } from 'react';

export function IdeaCard({ idea, onUseInCalendar }) {
  const [copied, setCopied] = useState(false);

  const copyHook = () => {
    navigator.clipboard.writeText(idea.hook);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <Badge variant="brand" size="sm">{idea.format}</Badge>
          <Badge
            variant={idea.estimated_effort === 'LOW' ? 'success' : idea.estimated_effort === 'MEDIUM' ? 'warning' : 'danger'}
            size="sm"
          >
            {idea.estimated_effort} EFFORT
          </Badge>
        </div>

        <h4 className="text-sm font-bold text-slate-100 mb-2 leading-snug">{idea.title}</h4>
        <p className="text-xs text-slate-400 mb-3.5 leading-relaxed">{idea.concept}</p>

        {/* Hook Box */}
        <div className="bg-slate-800/60 border border-slate-800 rounded-xl p-3 mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold text-brand-400">Opening Hook</span>
            <button
              onClick={copyHook}
              className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="text-xs font-semibold text-slate-200 italic">"{idea.hook}"</p>
        </div>

        {/* Why it fits & gap addressed */}
        <div className="space-y-1.5 text-[11px] mb-4">
          <div className="text-slate-400">
            <strong className="text-slate-300">Why it fits:</strong> {idea.why_it_fits || idea.reason}
          </div>
          {idea.gap_addressed && (
            <div className="text-slate-400">
              <strong className="text-brand-400">Gap addressed:</strong> {idea.gap_addressed}
            </div>
          )}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
        <span className="text-[10px] text-slate-500 truncate max-w-[150px]">CTA: {idea.cta}</span>
        {onUseInCalendar && (
          <Button size="sm" variant="outline" onClick={() => onUseInCalendar(idea)}>
            <span>Schedule</span>
            <ArrowRight className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
