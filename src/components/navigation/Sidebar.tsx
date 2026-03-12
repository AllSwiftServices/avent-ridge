import React from 'react';
import { Link, useLocation } from '@/lib/react-router-shim';
import { motion } from 'framer-motion';
import { LayoutDashboard, TrendingUp, PieChart, Wallet, User, Zap, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createPageUrl } from '@/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', page: 'Dashboard' },
  { icon: TrendingUp, label: 'Markets', page: 'Markets' },
  { icon: Radio, label: 'Live Trading', page: 'LiveTrading' },
  { icon: PieChart, label: 'Portfolio', page: 'Portfolio' },
  { icon: Wallet, label: 'Wallet', page: 'WalletPage' },
  { icon: User, label: 'Profile', page: 'Profile' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className={cn(
      'hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64',
      'bg-card border-r border-border p-4'
    )}>
      <div className="flex items-center gap-3 px-3 py-4 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
          <Zap className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="font-bold text-xl text-foreground">Avent Ridge</span>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === createPageUrl(item.page);
          return (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className={cn(
                'relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                'hover:bg-muted',
                isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeSidebar"
                  className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
        <p className="text-sm font-bold mb-1 text-foreground">Pro Trading</p>
        <p className="text-xs text-muted-foreground mb-3">
          Unlock advanced features and lower fees
        </p>
        <button className="w-full py-2 text-sm font-bold bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all shadow-md shadow-primary/10">
          Upgrade Now
        </button>
      </div>
    </aside>
  );
}