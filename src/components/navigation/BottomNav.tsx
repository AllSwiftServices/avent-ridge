import React from 'react';
import { Link, useLocation } from '@/lib/react-router-shim';
import { motion } from 'framer-motion';
import { LayoutDashboard, TrendingUp, PieChart, Wallet, Zap, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createPageUrl } from '@/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Home', page: 'dashboard' },
  { icon: TrendingUp, label: 'Markets', page: 'markets' },
  { icon: Zap, label: 'Trade', page: 'trade' },
  { icon: PieChart, label: 'Portfolio', page: 'portfolio' },
  { icon: Wallet, label: 'Wallet', page: 'wallet' },
];

import { useAuth } from '@/lib/AuthContext';
import { Shield } from 'lucide-react';

export default function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  
  return (
    <nav className={cn(
      'fixed bottom-0 left-0 right-0 z-40',
      'bg-background/80 backdrop-blur-xl border-t border-border',
      'md:hidden'
    )}>
      <div className="flex items-center justify-start sm:justify-around overflow-x-auto no-scrollbar py-2 px-2 safe-area-pb gap-1">
        {navItems.map((item) => {
          const isActive = location.pathname === createPageUrl(item.page);
          return (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className={cn(
                'relative flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all min-w-[72px] shrink-0',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary/10 rounded-2xl"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <item.icon className={cn(
                'h-5 w-5 relative z-10 transition-transform',
                isActive && 'scale-110'
              )} />
              <span className="text-[9px] min-[380px]:text-[10px] mt-1 font-medium relative z-10">
                {item.label}
              </span>
            </Link>
          );
        })}

        {user?.role === 'admin' && (
            <Link
              to={createPageUrl('Admin')}
              className={cn(
                'relative flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all min-w-[72px] shrink-0',
                location.pathname === '/admin' ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Shield className={cn(
                'h-5 w-5 relative z-10 transition-transform',
                location.pathname === '/admin' && 'scale-110'
              )} />
              <span className="text-[9px] min-[380px]:text-[10px] mt-1 font-medium relative z-10">
                Admin
              </span>
            </Link>
        )}
      </div>
    </nav>
  );
}