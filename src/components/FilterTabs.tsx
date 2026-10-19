'use client';

import React from 'react';

export type FilterOption = 'all' | 'warning' | 'expired' | 'fresh' | 'freezer';

interface FilterTabsProps {
  selected: FilterOption;
  onChange: (val: FilterOption) => void;
  counts: {
    all: number;
    warning: number;
    expired: number;
    fresh: number;
    freezer: number;
  };
}

export function FilterTabs({ selected, onChange, counts }: FilterTabsProps) {
  const tabs: { id: FilterOption; label: string; count: number; activeColor: string }[] = [
    { id: 'all', label: 'ทั้งหมด', count: counts.all, activeColor: 'bg-emerald-700 text-white shadow-emerald-700/20' },
    { id: 'warning', label: 'ใกล้หมดอายุ', count: counts.warning, activeColor: 'bg-amber-500 text-white shadow-amber-500/20' },
    { id: 'expired', label: 'หมดอายุแล้ว', count: counts.expired, activeColor: 'bg-red-500 text-white shadow-red-500/20' },
    { id: 'freezer', label: 'ช่องฟรีซ', count: counts.freezer, activeColor: 'bg-sky-600 text-white shadow-sky-600/20' },
    { id: 'fresh', label: 'ของสดยังดี', count: counts.fresh, activeColor: 'bg-emerald-600 text-white shadow-emerald-600/20' },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none no-scrollbar">
      {tabs.map((tab) => {
        const isActive = selected === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 select-none ${
              isActive
                ? `${tab.activeColor} shadow-md`
                : 'bg-white/80 text-slate-600 hover:bg-white border border-slate-200/70'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
