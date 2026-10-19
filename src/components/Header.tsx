'use client';

import React from 'react';
import { FreshKeepLogo } from './FridgeIllustration';
import { Mail, LogIn, LogOut, Bell, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface HeaderProps {
  user: { email: string; name: string; avatarUrl?: string } | null;
  onLogin: () => void;
  onLogout: () => void;
  onOpenSettings?: () => void;
}

export function Header({ user, onLogin, onLogout }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-emerald-100/60 px-4 py-2.5">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="hover:opacity-90 transition-opacity">
          <FreshKeepLogo />
        </Link>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Email Preview Link */}
          <Link
            href="/preview-email"
            target="_blank"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-medium border border-emerald-200/60 transition-colors"
            title="ดูตัวอย่างอีเมลแจ้งเตือน"
          >
            <Mail size={14} />
            <span className="hidden sm:inline">พรีวิวอีเมล</span>
          </Link>

          {/* User Profile or Login */}
          {user ? (
            <div className="flex items-center gap-2 pl-1">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-800 line-clamp-1">
                  {user.name}
                </span>
                <span className="text-[10px] text-slate-400 line-clamp-1">
                  {user.email}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-emerald-200">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="ออกจากระบบ"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <LogIn size={14} />
              <span>เข้าสู่ระบบ</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
