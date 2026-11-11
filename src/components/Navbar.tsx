import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { NotificationDropdown } from './NotificationDropdown';
import { Menu, Calendar, ShieldCheck, ArrowLeftRight, LogOut } from 'lucide-react';

interface NavbarProps {
  onMenuToggle: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuToggle }) => {
  const { user, login, logout, systemDate, dateOverride } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const getPageTitle = (path: string): { title: string; subtitle: string } => {
    switch (path) {
      case '/':
        return { title: 'Pharmacy Operations Dashboard', subtitle: 'Real-time overview of medicine inventory, expiry risks and safety alerts' };
      case '/medicines':
        return { title: 'Medicine Catalog', subtitle: 'Manage registered pharmaceutical items, categories, and manufacturers' };
      case '/batches':
        return { title: 'Batch Management', subtitle: 'Track unique production lots, manufacturing dates and initial stock' };
      case '/expiry-alerts':
        return { title: 'Expiry Alert Console', subtitle: 'Automated 4-tier expiry tracking and quarantine identification' };
      case '/recalls':
        return { title: 'Safety Recall Management', subtitle: 'Regulatory batch recall registration, tracking and quarantine' };
      case '/inventory':
        return { title: 'Stock & Inventory Management', subtitle: 'Real-time available stock levels with automated expiry/recall guards' };
      case '/reports':
        return { title: 'Analytics & Audit Reports', subtitle: 'Inventory statistics, visual charts and exportable CSV reports' };
      case '/settings':
        return { title: 'System Settings & Demonstration', subtitle: 'Simulate inspection dates, manage demo roles and reset sample data' };
      default:
        return { title: 'Medicine Expiry & Recall Alert System', subtitle: 'Hospital & Community Pharmacy Management' };
    }
  };

  const { title, subtitle } = getPageTitle(location.pathname);

  const formattedDate = systemDate.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const toggleRole = () => {
    if (user?.role === 'admin') {
      login('staff');
    } else {
      login('admin');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          aria-label="Open sidebar navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate tracking-tight">{title}</h2>
          <p className="text-xs text-slate-500 hidden sm:block truncate">{subtitle}</p>
        </div>
      </div>

      {/* Right side items */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* System Date Badge (with indicator if overridden) */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700">
          <Calendar className="w-3.5 h-3.5 text-emerald-700" />
          <span className="tabular-nums">{formattedDate}</span>
          {dateOverride && (
            <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-1.5 py-0.2 rounded-sm">
              Simulated
            </span>
          )}
        </div>

        {/* Demo role switch badge */}
        {user && (
          <button
            onClick={toggleRole}
            title="Click to quickly switch between Admin and Pharmacy Staff roles"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-900 text-xs font-semibold transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="hidden sm:inline capitalize">{user.role}:</span>
            <span className="font-bold">{user.name.split(' ')[0]}</span>
            <ArrowLeftRight className="w-3 h-3 text-emerald-600 ml-0.5 shrink-0" />
          </button>
        )}

        {/* Notifications Dropdown */}
        <NotificationDropdown />

        {/* Direct Logout (desktop icon) */}
        <button
          onClick={handleLogout}
          title="Sign out of demonstration session"
          className="hidden sm:flex p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
