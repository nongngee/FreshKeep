'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FoodItem, StorageType } from '@/lib/types';
import { ArrowLeft, Save, Camera, Upload, X } from 'lucide-react';
import { compressImage } from '@/lib/image-utils';

interface EditFoodModalProps {
  item: FoodItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedItem: FoodItem) => void;
}

export function EditFoodModal({ item, isOpen, onClose, onSave }: EditFoodModalProps) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('ชิ้น');
  const [storageType, setStorageType] = useState<StorageType>('chiller');
  const [expiryDate, setExpiryDate] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isProcessingImg, setIsProcessingImg] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (item) {
      setName(item.name);
      setQuantity(item.quantity);
      setUnit(item.unit);
      setStorageType(item.storageType);
      setExpiryDate(item.expiryDate);
      setPurchaseDate(item.purchaseDate || '');
      setImageUrl(item.imageUrl || null);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingImg(true);
      const dataUrl = await compressImage(file);
      setImageUrl(dataUrl);
    } catch (err) {
      console.error('Error processing image:', err);
    } finally {
      setIsProcessingImg(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      ...item,
      name: name.trim(),
      quantity,
      unit,
      storageType,
      expiryDate,
      purchaseDate,
      imageUrl: imageUrl || undefined,
      updatedAt: new Date().toISOString(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-emerald-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/40">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 text-sm font-semibold text-emerald-800 hover:text-emerald-950 transition-colors"
          >
            <ArrowLeft size={18} />
            <span>แก้ไขข้อมูลอาหาร</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {/* Image Upload / Camera Area */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              รูปภาพอาหาร
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />

            {imageUrl ? (
              <div className="relative w-full h-44 bg-slate-100 rounded-2xl overflow-hidden border border-emerald-200 group">
                <img src={imageUrl} alt="Food Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrl(null)}
                  className="absolute top-2 right-2 p-1.5 bg-slate-900/70 hover:bg-red-600 text-white rounded-full transition-colors shadow-md"
                  title="ลบรูปภาพ"
                >
                  <X size={16} />
                </button>
                <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-full bg-black/60 text-white text-[10px] font-medium backdrop-blur-xs">
                  แตะที่ปุ่มกากบาทเพื่อเปลี่ยนรูป
                </div>
              </div>
            ) : (
              <div className="w-full bg-emerald-50/60 border-2 border-dashed border-emerald-200/80 rounded-2xl p-4 text-center">
                <div className="flex justify-center gap-3 mb-2">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Camera size={16} className="text-emerald-600" />
                    <span>ถ่ายภาพ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Upload size={16} className="text-emerald-600" />
                    <span>เลือกจากเครื่อง</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  {isProcessingImg ? 'กำลังประมวลผลรูปภาพ...' : 'เพิ่มรูปเพื่อช่วยให้จำของในตู้เย็นได้ง่ายขึ้น'}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ชื่ออาหาร
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-slate-50/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                จำนวน
              </label>
              <input
                type="text"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-slate-50/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                หน่วย
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-slate-50/50"
              >
                <option value="ชิ้น">ชิ้น</option>
                <option value="กล่อง">กล่อง</option>
                <option value="ฟอง">ฟอง</option>
                <option value="ถุง">ถุง</option>
                <option value="แพ็ค">แพ็ค</option>
                <option value="ขวด">ขวด</option>
                <option value="ถ้วย">ถ้วย</option>
                <option value="ก้อน">ก้อน</option>
                <option value="กรัม">กรัม</option>
                <option value="กิโลกรัม">กิโลกรัม</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ช่องจัดเก็บ
            </label>
            <select
              value={storageType}
              onChange={(e) => setStorageType(e.target.value as StorageType)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-slate-50/50"
            >
              <option value="chiller">🧊 ช่องแช่ธรรมดา</option>
              <option value="freezer">❄️ ช่องแช่แข็ง</option>
              <option value="pantry">🧺 นอกตู้เย็น</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              วันหมดอายุ
            </label>
            <input
              type="date"
              required
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-slate-50/50"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 text-sm"
            >
              <span>บันทึกการแก้ไข</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
