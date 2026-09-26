import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Sparkles, Lightbulb, Calendar, Target } from 'lucide-react';

export function MobileNavigation() {
  const items = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Profiles', path: '/profiles', icon: Users },
    { name: 'Feedback', path: '/feedback', icon: Sparkles },
    { name: 'Ideas', path: '/ideas', icon: Lightbulb },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Campaigns', path: '/campaigns', icon: Target },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 flex items-center justify-around">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center p-1.5 rounded-lg text-[10px] font-medium transition-colors ${
                isActive ? 'text-brand-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <Icon className="w-4 h-4 mb-0.5" />
            <span>{item.name}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

export default MobileNavigation;
