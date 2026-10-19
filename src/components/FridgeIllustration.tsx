import React from 'react';

export function FridgeIllustration({ size = 160, className = '' }: { size?: number; className?: string }) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <img
        src="/logo.png"
        alt="FreshKeep"
        width={size}
        height={size}
        className="object-contain drop-shadow-sm select-none"
      />
    </div>
  );
}

export function FreshKeepLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      <img
        src="/logo.png"
        alt="FreshKeep Logo"
        className="w-10 h-10 object-contain"
      />
      <div className="font-bold tracking-tight text-xl leading-none flex items-center">
        <span className="text-[#4e8d53] font-extrabold">Fresh</span>
        <span className="text-[#f59e42] font-extrabold">Keep</span>
      </div>
    </div>
  );
}
