'use client';

import React, { useState } from 'react';
import { FoodItem } from '@/lib/types';
import { getExpiryStatus } from '@/lib/mock-data';
import { MoreVertical, CheckCircle2, Trash2, Edit2, AlertCircle, Clock, Utensils } from 'lucide-react';

interface FoodCardProps {
  item: FoodItem;
  onEdit: (item: FoodItem) => void;
  onDelete: (id: string) => void;
  onConsume: (id: string) => void;
}

export function FoodCard({ item, onEdit, onDelete, onConsume }: FoodCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const status = getExpiryStatus(item.expiryDate);

  return (
    <div className={`relative bg-white rounded-2xl p-3 border transition-all duration-200 hover:shadow-md flex flex-col justify-between ${status.cardBorder}`}>
      {/* Top Media & Actions */}
      <div className="relative">
        {/* Real Food Image or Soft Placeholder */}
        <div className="w-full h-32 bg-emerald-50/70 rounded-xl flex items-center justify-center overflow-hidden border border-emerald-100/60">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center text-emerald-600/70">
              <Utensils size={32} strokeWidth={1.5} className="mb-1 text-emerald-500/80" />
              <span className="text-[10px] font-medium text-emerald-800/60">ไม่มีรูปภาพ</span>
            </div>
          )}
        </div>

        {/* 3-dots Menu Button */}
        <div className="absolute top-1.5 right-1.5">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-full bg-white/90 text-slate-500 hover:text-slate-800 hover:bg-white shadow-sm transition-colors"
            title="ตัวเลือก"
          >
            <MoreVertical size={16} />
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-20 text-xs text-slate-700 animate-in fade-in zoom-in-95">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onConsume(item.id);
                  }}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-emerald-50 text-emerald-700 font-medium"
                >
                  <CheckCircle2 size={14} />
                  <span>ทานหมดแล้ว</span>
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(item);
                  }}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-50 text-slate-700"
                >
                  <Edit2 size={14} />
                  <span>แก้ไข</span>
                </button>
                <div className="my-1 border-t border-slate-100" />
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(item.id);
                  }}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-red-50 text-red-600 font-medium"
                >
                  <Trash2 size={14} />
                  <span>ลบรายการ</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Storage Tag */}
        <div className="mt-2.5 flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-400">
            {item.storageType === 'freezer'
              ? '❄️ ช่องฟรีซ'
              : item.storageType === 'pantry'
              ? '🧺 นอกตู้'
              : '🧊 ช่องธรรมดา'}
          </span>
        </div>
      </div>

      {/* Info section */}
      <div className="mt-1 flex-1">
        <h3 className="font-semibold text-slate-800 text-[14px] leading-tight line-clamp-1" title={item.name}>
          {item.name}
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          {item.quantity} {item.unit}
        </p>
      </div>

      {/* Status Badge */}
      <div className="mt-2.5 pt-2 border-t border-slate-100/80">
        <div
          className={`w-full py-1 px-2 rounded-full text-[11px] text-center flex items-center justify-center gap-1 leading-none ${status.badgeClass}`}
        >
          {status.urgency === 'expired' && <AlertCircle size={12} className="shrink-0" />}
          {status.urgency === 'warning' && <Clock size={12} className="shrink-0" />}
          <span className="truncate">{status.badgeText}</span>
        </div>
      </div>
    </div>
  );
}
