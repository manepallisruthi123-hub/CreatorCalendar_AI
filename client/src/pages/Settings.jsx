import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { ShieldCheck, Database, Key, Server, User, LogOut } from 'lucide-react';

export function Settings() {
  const { user, logout } = useAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-xl font-bold text-slate-100">System & Account Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Review your account profile, verified security layers, and AI service configuration
        </p>
      </div>

      {/* User Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-brand-600/20 border border-brand-500/30 text-brand-300 flex items-center justify-center font-bold text-lg">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">{user?.name}</h3>
            <p className="text-xs text-slate-400">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-[11px] text-slate-400 block">User Identifier</span>
            <span className="text-slate-300 font-mono text-[11px] truncate block">{user?.id}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Authentication Mode</span>
            <span className="text-emerald-400 font-semibold">JWT Bearer Auth (7d expiry)</span>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <Button variant="danger" size="sm" icon={LogOut} onClick={logout}>
            Sign Out
          </Button>
        </div>
      </div>

      {/* Architectural Security Checks */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Production Security Configuration
        </h3>

        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start gap-3">
            <Key className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-semibold text-slate-200">Backend-Only Secrets Isolation</h4>
                <Badge variant="success" size="sm">Active</Badge>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                GEMINI_API_KEY, JWT_SECRET, and DATABASE_URL are strictly isolated in Node.js backend. Zero keys exposed to the client bundle.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start gap-3">
            <Database className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-semibold text-slate-200">PostgreSQL Data Isolation</h4>
                <Badge variant="success" size="sm">Enforced</Badge>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Every SQL query enforces strict ownership verification (<code>WHERE user_id = $authUserId</code>). Users cannot view or mutate another user's content.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start gap-3">
            <Server className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-semibold text-slate-200">Rate Limiting & Input Validation</h4>
                <Badge variant="success" size="sm">Enforced</Badge>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                All inputs and AI outputs validated with Zod schemas. AI routes protected with dedicated rate limiting.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
