import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Pill,
  Boxes,
  AlertTriangle,
  ShieldAlert,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
  Cross,
  UserCheck,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout, stats } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      name: 'Dashboard',
      path: '/',
      icon: <LayoutDashboard className="w-5 h-5 shrink-0" />,
    },
    {
      name: 'Medicine Management',
      path: '/medicines',
      icon: <Pill className="w-5 h-5 shrink-0" />,
      badge: stats.totalMedicines,
    },
    {
      name: 'Batch Management',
      path: '/batches',
      icon: <Boxes className="w-5 h-5 shrink-0" />,
      badge: stats.totalBatches,
    },
    {
      name: 'Expiry Alerts',
      path: '/expiry-alerts',
      icon: <AlertTriangle className="w-5 h-5 shrink-0" />,
      alertCount: stats.expiringSoonCount + stats.expiredCount,
      alertColor: stats.expiredCount > 0 ? 'bg-rose-500' : 'bg-amber-500',
    },
    {
      name: 'Recall Management',
      path: '/recalls',
      icon: <ShieldAlert className="w-5 h-5 shrink-0" />,
      alertCount: stats.recalledCount,
      alertColor: 'bg-purple-500',
    },
    {
      name: 'Inventory',
      path: '/inventory',
      icon: <ClipboardList className="w-5 h-5 shrink-0" />,
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: <BarChart3 className="w-5 h-5 shrink-0" />,
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: <Settings className="w-5 h-5 shrink-0" />,
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-68 bg-emerald-950 text-white flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } border-r border-emerald-900/50 shadow-xl lg:shadow-none`}
      >
        {/* Brand header */}
        <div className="p-5 border-b border-emerald-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700/80 border border-emerald-600/50 flex items-center justify-center text-white shadow-inner">
              <Cross className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight leading-tight">PharmaAlert</h1>
              <p className="text-[11px] text-emerald-300 font-medium tracking-wide">Expiry & Recall System</p>
            </div>
          </div>
        </div>

        {/* User profile capsule in sidebar */}
        {user && (
          <div className="px-4 py-3 mx-3 mt-3 rounded-lg bg-emerald-900/50 border border-emerald-800/60 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold text-white uppercase shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <UserCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="text-[10px] text-emerald-300 capitalize font-medium">{user.role} role</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                    : 'text-emerald-100/80 hover:bg-emerald-900/60 hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-3 min-w-0">
                {item.icon}
                <span className="truncate">{item.name}</span>
              </div>

              {/* Alert / Count badges */}
              {item.alertCount !== undefined && item.alertCount > 0 ? (
                <span
                  className={`text-[11px] font-bold text-white px-2 py-0.5 rounded-full ${item.alertColor} shadow-xs tabular-nums`}
                >
                  {item.alertCount}
                </span>
              ) : item.badge !== undefined ? (
                <span className="text-[11px] font-medium text-emerald-200/70 px-2 py-0.5 rounded-md bg-emerald-900/40 tabular-nums">
                  {item.badge}
                </span>
              ) : null}
            </NavLink>
          ))}
        </nav>

        {/* Bottom logout area */}
        <div className="p-3 border-t border-emerald-900/60">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-emerald-200/80 hover:bg-rose-950/60 hover:text-rose-200 transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5 shrink-0 text-emerald-300" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
