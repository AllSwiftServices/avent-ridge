import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LiveIndicator({ soundOn, onToggleSound }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
        <span className="text-[11px] font-bold text-red-500 tracking-wider">LIVE</span>
      </div>
      <button
        onClick={onToggleSound}
        className={cn(
          'p-1.5 rounded-lg transition-colors',
          soundOn ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-muted'
        )}
        title="Toggle sound"
      >
        {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      </button>
    </div>
  );
}