'use client';

import React, { useState, useEffect } from 'react';
import { FoodItem } from '@/lib/types';
import { getExpiryStatus } from '@/lib/mock-data';
import { Header } from '@/components/Header';
import { FoodCard } from '@/components/FoodCard';
import { FilterTabs, FilterOption } from '@/components/FilterTabs';
import { AddFoodModal } from '@/components/AddFoodModal';
import { EditFoodModal } from '@/components/EditFoodModal';
import { Plus, AlertCircle, Sparkles, Lock } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function Home() {
  const [isInFridge, setIsInFridge] = useState(false);
  const [user, setUser] = useState<{ email: string; name: string; id?: string; avatarUrl?: string } | null>(null);

  const [items, setItems] = useState<FoodItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Status/Storage Filter
  const [filter, setFilter] = useState<FilterOption>('all');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Listen to Supabase Auth State
  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) {
      // Fallback demo user if not connected
      setUser({ email: 'youremail@gmail.com', name: 'ผู้ใช้งาน' });
      return;
    }

    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'ผู้ใช้งาน',
          avatarUrl: session.user.user_metadata?.avatar_url,
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'ผู้ใช้งาน',
          avatarUrl: session.user.user_metadata?.avatar_url,
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Load Items (from Supabase if user logged in, otherwise localStorage)
  const loadItems = async () => {
    if (supabase && user?.id) {
      try {
        const { data, error } = await supabase
          .from('food_items')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('expiry_date', { ascending: true });

        if (error) {
          console.error('Error fetching food items:', error);
        } else if (data) {
          const mapped: FoodItem[] = data.map((d: any) => ({
            id: d.id,
            userId: d.user_id,
            name: d.name,
            categoryId: d.category_id || 'general',
            quantity: d.quantity || '1',
            unit: d.unit || 'ชิ้น',
            storageType: d.storage_type || 'chiller',
            purchaseDate: d.purchase_date || '',
            expiryDate: d.expiry_date,
            status: d.status || 'active',
            imageUrl: d.image_url || undefined,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
          }));
          setItems(mapped);
          setIsLoaded(true);
          return;
        }
      } catch (err) {
        console.error(err);
      }
    }

    // Fallback: LocalStorage
    try {
      const isCleaned = localStorage.getItem('freshkeep_cleaned_v1');
      if (!isCleaned) {
        localStorage.removeItem('freshkeep_items');
        localStorage.setItem('freshkeep_cleaned_v1', 'true');
        setItems([]);
      } else {
        const saved = localStorage.getItem('freshkeep_items');
        setItems(saved ? JSON.parse(saved) : []);
      }
    } catch {
      setItems([]);
    }
    setIsLoaded(true);
  };

  useEffect(() => {
    loadItems();
  }, [user]);

  // Save to LocalStorage helper
  const saveLocalItems = (newItems: FoodItem[]) => {
    setItems(newItems);
    try {
      localStorage.setItem('freshkeep_items', JSON.stringify(newItems));
    } catch (e) {
      console.error(e);
    }
  };

  // Google Login Handler
  const handleGoogleLogin = async () => {
    if (supabase && isSupabaseConfigured) {
      const origin = typeof window !== 'undefined'
        ? (window.location.origin.includes('0.0.0.0') ? 'http://localhost:3000' : window.location.origin)
        : 'http://localhost:3000';

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      });
      if (error) {
        showToast(`⚠️ ข้อความ: ${error.message}`);
      }
    } else {
      setUser({ email: 'youremail@gmail.com', name: 'คุณนัท' });
      showToast('🔑 เข้าสู่ระบบจำลองเรียบร้อย');
    }
  };

  // Logout Handler
  const handleLogout = async () => {
    if (supabase && isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setIsInFridge(false);
    showToast('👋 ออกจากระบบแล้ว');
  };

  // Add Item Handler
  const handleAddItem = async (data: Omit<FoodItem, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'status'>) => {
    if (supabase && user?.id) {
      try {
        const { data: inserted, error } = await supabase
          .from('food_items')
          .insert({
            user_id: user.id,
            name: data.name,
            quantity: data.quantity,
            unit: data.unit,
            storage_type: data.storageType,
            purchase_date: data.purchaseDate || null,
            expiry_date: data.expiryDate,
            image_url: data.imageUrl || null,
            status: 'active',
          })
          .select()
          .single();

        if (error) {
          showToast(`⚠️ ไม่สามารถบันทึก: ${error.message}`);
          return;
        }

        if (inserted) {
          const newItem: FoodItem = {
            id: inserted.id,
            userId: inserted.user_id,
            name: inserted.name,
            categoryId: inserted.category_id || 'general',
            quantity: inserted.quantity,
            unit: inserted.unit,
            storageType: inserted.storage_type,
            purchaseDate: inserted.purchase_date,
            expiryDate: inserted.expiry_date,
            status: inserted.status,
            imageUrl: inserted.image_url,
            createdAt: inserted.created_at,
            updatedAt: inserted.updated_at,
          };
          setItems([newItem, ...items]);
          showToast(`✨ บันทึก "${newItem.name}" ลงฐานข้อมูล Supabase แล้ว`);
          return;
        }
      } catch (err: any) {
        console.error(err);
      }
    }

    // Local fallback
    const newItem: FoodItem = {
      ...data,
      id: Date.now().toString(),
      userId: user?.email || 'demo-user',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveLocalItems([newItem, ...items]);
    showToast(`✨ เพิ่ม "${newItem.name}" ลงในตู้เย็นแล้ว`);
  };

  // Edit Item Handler
  const handleEditItem = async (updated: FoodItem) => {
    if (supabase && user?.id) {
      try {
        await supabase
          .from('food_items')
          .update({
            name: updated.name,
            quantity: updated.quantity,
            unit: updated.unit,
            storage_type: updated.storageType,
            expiry_date: updated.expiryDate,
            purchase_date: updated.purchaseDate || null,
            image_url: updated.imageUrl || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', updated.id);
      } catch (err) {
        console.error(err);
      }
    }
    setItems(items.map((i) => (i.id === updated.id ? updated : i)));
    showToast(`✏️ อัปเดตข้อมูล "${updated.name}" แล้ว`);
  };

  // Delete Item Handler
  const handleDeleteItem = async (id: string) => {
    const target = items.find((i) => i.id === id);
    if (supabase && user?.id) {
      try {
        await supabase.from('food_items').delete().eq('id', id);
      } catch (err) {
        console.error(err);
      }
    }
    setItems(items.filter((i) => i.id !== id));
    showToast(`🗑️ ลบ "${target?.name || 'รายการ'}" ออกแล้ว`);
  };

  // Mark Consumed Handler
  const handleConsumeItem = async (id: string) => {
    const target = items.find((i) => i.id === id);
    if (supabase && user?.id) {
      try {
        await supabase.from('food_items').update({ status: 'consumed' }).eq('id', id);
      } catch (err) {
        console.error(err);
      }
    }
    setItems(items.filter((i) => i.id !== id));
    showToast(`🎉 ยอดเยี่ยม! ทาน "${target?.name}" หมดเรียบร้อย`);
  };

  // Counts
  const counts = {
    all: items.length,
    warning: items.filter((i) => getExpiryStatus(i.expiryDate).urgency === 'warning').length,
    expired: items.filter((i) => getExpiryStatus(i.expiryDate).urgency === 'expired').length,
    fresh: items.filter((i) => getExpiryStatus(i.expiryDate).urgency === 'fresh').length,
    freezer: items.filter((i) => i.storageType === 'freezer').length,
  };

  // Filtered
  const filteredItems = items.filter((item) => {
    const status = getExpiryStatus(item.expiryDate);
    if (filter === 'warning' && status.urgency !== 'warning') return false;
    if (filter === 'expired' && status.urgency !== 'expired') return false;
    if (filter === 'fresh' && status.urgency !== 'fresh') return false;
    if (filter === 'freezer' && item.storageType !== 'freezer') return false;
    return true;
  });

  if (!isLoaded) return null;

  // SCREEN 1: LANDING & LOGIN
  if (!isInFridge) {
    return (
      <main className="min-h-screen bg-[#eaf4ed] flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="max-w-sm w-full flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
          <div className="mb-4 transform hover:scale-105 transition-transform flex items-center justify-center">
            <img
              src="/logo.png"
              alt="FreshKeep Logo"
              className="w-56 h-56 object-contain drop-shadow-md"
            />
          </div>

          <p className="text-sm font-medium text-emerald-900/80 mb-8 max-w-xs leading-relaxed">
            แอปพลิเคชันจัดการตู้เย็น และแจ้งเตือนของหมดอายุผ่านอีเมล
          </p>

          <div className="w-full space-y-3">
            {user ? (
              <>
                <button
                  onClick={() => setIsInFridge(true)}
                  className="w-full py-4 px-6 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold rounded-2xl shadow-xl shadow-emerald-800/25 text-base transition-all transform active:scale-98 flex items-center justify-center gap-2"
                >
                  <span>เปิดตู้เย็นเลย</span>
                </button>

                <div className="w-full py-3 px-4 rounded-xl bg-white/80 border border-emerald-200/80 text-xs font-semibold text-emerald-900 flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-[11px] text-slate-400 hover:text-red-500 transition-colors ml-2 shrink-0"
                  >
                    ออกจากระบบ
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Disabled Open Fridge Button when not logged in */}
                <button
                  disabled
                  className="w-full py-4 px-6 bg-slate-200/80 text-slate-400 font-bold rounded-2xl text-base cursor-not-allowed border border-slate-300/60 flex items-center justify-center gap-2 select-none"
                  title="กรุณาเข้าสู่ระบบด้วย Google ก่อนเปิดตู้เย็น"
                >
                  <Lock size={18} className="text-slate-400" />
                  <span>เปิดตู้เย็นเลย</span>
                </button>

                {/* Primary Google Login Button */}
                <button
                  onClick={handleGoogleLogin}
                  className="w-full py-4 px-6 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold rounded-2xl shadow-xl shadow-emerald-800/25 text-base transition-all transform active:scale-98 flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5 bg-white rounded-full p-0.5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>เข้าสู่ระบบด้วย Google</span>
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    );
  }

  // SCREEN 2: FRIDGE DASHBOARD
  return (
    <div className="min-h-screen bg-[#f1f7f4] pb-28">
      <Header
        user={user}
        onLogin={handleGoogleLogin}
        onLogout={handleLogout}
      />

      <main className="max-w-2xl mx-auto px-4 pt-4">
        {toastMessage && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white px-4 py-2.5 rounded-full text-xs font-medium shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <span>{toastMessage}</span>
          </div>
        )}

        {(counts.warning > 0 || counts.expired > 0) && (
          <div className="mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-between gap-3 text-xs text-amber-900 shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-600 shrink-0" />
              <span>
                มีอาหาร <strong>{counts.warning + counts.expired} รายการ</strong> ใกล้หมดอายุหรือหมดอายุแล้ว!
              </span>
            </div>
            <button
              onClick={() => setFilter('warning')}
              className="px-2.5 py-1 rounded-lg bg-amber-200/70 hover:bg-amber-200 text-amber-950 font-semibold text-[11px] shrink-0"
            >
              ดูเลย
            </button>
          </div>
        )}

        <div className="mb-4">
          <FilterTabs selected={filter} onChange={setFilter} counts={counts} />
        </div>

        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredItems.map((item) => (
              <FoodCard
                key={item.id}
                item={item}
                onEdit={setEditingItem}
                onDelete={handleDeleteItem}
                onConsume={handleConsumeItem}
              />
            ))}
          </div>
        ) : (
          <div className="py-14 text-center bg-white/70 rounded-3xl border border-dashed border-emerald-200/80 p-6 shadow-xs">
            <div className="text-4xl mb-3">🧊✨</div>
            <h4 className="text-base font-bold text-emerald-950 mb-1">ตู้เย็นของคุณยังว่างอยู่</h4>
            <p className="text-xs text-slate-500 mb-5 max-w-xs mx-auto leading-relaxed">
              ยังไม่มีรายการอาหารในตู้เย็น กดปุ่มด้านล่างเพื่อเริ่มถ่ายภาพหรือบันทึกของสดชิ้นแรกได้เลย!
            </p>
            <button
              onClick={() => setIsAddOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-md shadow-emerald-700/20 transition-all transform active:scale-95"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>เพิ่มอาหารชิ้นแรก</span>
            </button>
          </div>
        )}
      </main>

      <div className="fixed bottom-6 left-0 right-0 flex justify-center z-30 pointer-events-none">
        <button
          onClick={() => setIsAddOpen(true)}
          className="pointer-events-auto py-3 px-7 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold rounded-full shadow-xl shadow-emerald-900/30 flex items-center gap-2 text-sm transition-transform active:scale-95"
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>เพิ่มอาหาร +</span>
        </button>
      </div>

      <AddFoodModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={handleAddItem}
      />

      <EditFoodModal
        item={editingItem}
        isOpen={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        onSave={handleEditItem}
      />
    </div>
  );
}
