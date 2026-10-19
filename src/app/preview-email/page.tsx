'use client';

import React, { useState } from 'react';
import { generateExpiryAlertEmailHtml } from '@/lib/email-template';
import { INITIAL_FOOD_ITEMS } from '@/lib/mock-data';
import { ArrowLeft, Mail, Send, CheckCircle2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function PreviewEmailPage() {
  const [testEmail, setTestEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const expiringSoonItems = INITIAL_FOOD_ITEMS.filter(i => i.id === '2');
  const expiredItems = INITIAL_FOOD_ITEMS.filter(i => i.id === '3' || i.id === '5');

  const emailHtml = generateExpiryAlertEmailHtml({
    userName: 'คุณนัท (Demo User)',
    userEmail: testEmail || 'your-email@gmail.com',
    expiringSoonItems,
    expiredItems,
  });

  const handleSendTest = async () => {
    setSending(true);
    setResultMessage(null);
    try {
      const res = await fetch(`/api/cron/check-expiry?test=true&to=${encodeURIComponent(testEmail || 'test@example.com')}`);
      const data = await res.json();
      if (data.mode === 'simulated_local') {
        setResultMessage('💡 ระบบจำลองการส่งสำเร็จ! (เมื่อใส่ RESEND_API_KEY จริงใน .env ระบบจะยิงเข้า Gmail จริงทันที)');
      } else if (data.success) {
        setResultMessage('✅ ส่งอีเมลแจ้งเตือนสำเร็จแล้ว! เช็กใน Inbox ของคุณได้เลย');
      } else {
        setResultMessage(`⚠️ ข้อความจากระบบ: ${data.error || 'เกิดข้อผิดพลาด'}`);
      }
    } catch (err: any) {
      setResultMessage(`❌ เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Top toolbar */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-xs border border-slate-200">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800 hover:text-emerald-950 transition-colors"
          >
            <ArrowLeft size={18} />
            <span>กลับหน้าหลัก FreshKeep</span>
          </Link>

          {/* Test Sender Controls */}
          <div className="flex items-center gap-2">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="ใส่อีเมลเพื่อทดสอบส่ง..."
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48"
            />
            <button
              onClick={handleSendTest}
              disabled={sending}
              className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
            >
              <Send size={13} />
              <span>{sending ? 'กำลังส่ง...' : 'ทดสอบส่ง'}</span>
            </button>
          </div>
        </div>

        {resultMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-900 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{resultMessage}</span>
          </div>
        )}

        {/* Browser Mockup */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
          <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center gap-2 text-xs text-slate-500">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
            <span className="font-mono text-[11px] text-slate-400 ml-2">Preview: Email Alert Template</span>
          </div>

          <div className="p-2 sm:p-6 bg-slate-100/60">
            <div dangerouslySetInnerHTML={{ __html: emailHtml }} />
          </div>
        </div>
      </div>
    </div>
  );
}
