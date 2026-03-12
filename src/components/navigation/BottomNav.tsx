import React from 'react';
import { Link, useLocation } from '@/lib/react-router-shim';
import { motion } from 'framer-motion';
import { LayoutDashboard, TrendingUp, PieChart, Wallet, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createPageUrl } from '@/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', page: 'Dashboard' },
  { icon: TrendingUp, label: 'Markets', page: 'Markets' },
  { icon: Radio, label: 'Live', page: 'LiveTrading' },
  { icon: PieChart, label: 'Portfolio', page: 'Portfolio' },
  { icon: Wallet, label: 'Wallet', page: 'WalletPage' },
];

export default function BottomNav() {
  const location = useLocation();
  
  return (
    <nav className={cn(
      'fixed bottom-0 left-0 right-0 z-40',
      'bg-background/80 backdrop-blur-xl border-t border-border',
      'md:hidden'
    )}>
      <div className="flex items-center justify-around py-2 px-2 safe-area-pb">
        {navItems.map((item) => {
          const isActive = location.pathname === createPageUrl(item.page);
          return (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className={cn(
                'relative flex flex-col items-center py-2 px-4 rounded-2xl transition-all',
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
              <span className="text-[10px] mt-1 font-medium relative z-10">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}