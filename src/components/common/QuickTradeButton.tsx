import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function QuickTradeButton({ onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'fixed right-4 bottom-24 md:bottom-8 z-30',
        'w-14 h-14 rounded-full',
        'bg-gradient-to-br from-primary to-blue-600',
        'text-white shadow-lg shadow-primary/30',
        'flex items-center justify-center',
        'hover:shadow-xl hover:shadow-primary/40 transition-shadow'
      )}
    >
      <Plus className="h-6 w-6" />
    </motion.button>
  );
}