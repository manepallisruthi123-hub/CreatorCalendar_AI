import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  LineChart,
  Lightbulb,
  Calendar,
  FileText,
  Target,
  Settings,
  Sparkles,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function Sidebar({ className = '' }) {
  const { logout, user } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Profiles', path: '/profiles', icon: Users },
    { name: 'Analysis', path: '/analyze', icon: LineChart },
    { name: 'Creative Ideas', path: '/ideas', icon: Lightbulb },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Posts', path: '/posts', icon: FileText },
    { name: 'Campaigns', path: '/campaigns', icon: Target },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className={`flex flex-col w-64 bg-slate-900 border-r border-slate-800 shrink-0 select-none ${className}`}>
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/25">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <span className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
            CreatorCalendar <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">AI</span>
          </span>
          <p className="text-[10px] text-slate-400 font-medium truncate max-w-[130px]">Strategy & Intelligence</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Workspace
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-800">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-lg bg-brand-600/30 border border-brand-500/40 text-brand-300 flex items-center justify-center font-bold text-xs shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-slate-200 truncate">{user?.name || 'Creator'}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
