'use client';

import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';

interface InteractiveCheckboxProps {
  id?: string;
  checked?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
  onToggle?: (newChecked: boolean) => void;
}

export function InteractiveCheckbox({
  id,
  checked: initialChecked = false,
  children,
  onToggle,
}: InteractiveCheckboxProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [isChecked, setIsChecked] = useState(initialChecked);

  useEffect(() => {
    setIsChecked(initialChecked);
  }, [initialChecked]);

  const handleToggle = () => {
    const next = !isChecked;
    setIsChecked(next);
    onToggle?.(next);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div
      role="checkbox"
      aria-checked={isChecked}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={handleToggle}
      className={`group flex items-start gap-2.5 py-1 px-1.5 -mx-1.5 rounded-lg cursor-pointer transition-colors select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
        isDark ? 'hover:bg-emerald-500/5' : 'hover:bg-emerald-50/60'
      }`}
    >
      {/* Custom Emerald Checkbox */}
      <div
        className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border transition-all shrink-0 ${
          isChecked
            ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/30'
            : isDark
            ? 'border-emerald-500/40 bg-emerald-500/5 group-hover:border-emerald-400'
            : 'border-emerald-600/50 bg-white group-hover:border-emerald-600'
        }`}
      >
        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
      </div>

      {/* Label / Children */}
      <div
        className={`text-sm leading-relaxed transition-colors ${
          isChecked
            ? 'line-through text-slate-400'
            : isDark
            ? 'text-slate-200 group-hover:text-white'
            : 'text-slate-800 group-hover:text-slate-950'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export default InteractiveCheckbox;
