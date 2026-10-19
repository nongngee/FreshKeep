import { Category, FoodItem } from './types';

export const CATEGORIES: Category[] = [
  { id: 'all', nameTh: 'ทั้งหมด', nameEn: 'All', icon: 'Grid', color: '#10b981' },
  { id: 'dairy', nameTh: 'นม & ไข่', nameEn: 'Dairy & Eggs', icon: 'Milk', color: '#f59e0b' },
  { id: 'meat', nameTh: 'เนื้อสัตว์', nameEn: 'Meat', icon: 'Beef', color: '#ef4444' },
  { id: 'vegetable', nameTh: 'ผักผลไม้', nameEn: 'Veggies', icon: 'Salad', color: '#10b981' },
  { id: 'drinks', nameTh: 'เครื่องดื่ม', nameEn: 'Drinks', icon: 'CupSoda', color: '#06b6d4' },
  { id: 'ready', nameTh: 'พร้อมทาน', nameEn: 'Ready-to-eat', icon: 'Utensils', color: '#f97316' },
];

export const STORAGE_TYPES = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'chiller', label: 'ช่องแช่ธรรมดา' },
  { id: 'freezer', label: 'ช่องแช่แข็ง' },
  { id: 'pantry', label: 'อุณหภูมิห้อง' },
];

// Helper to format date in Thai Buddhist Era (พ.ศ.) matching Figma
export function formatThaiDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const thaiMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  const day = date.getDate();
  const month = thaiMonths[date.getMonth()];
  const year = date.getFullYear() + 543;
  return `${day} ${month} ${year}`;
}

// Calculate days remaining and urgency status
export function getExpiryStatus(expiryDateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDateStr);
  expiry.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      urgency: 'expired' as const,
      diffDays,
      badgeText: 'หมดอายุแล้ว',
      badgeClass: 'bg-red-50 text-red-600 border border-red-200',
      cardBorder: 'border-red-200 bg-red-50/20',
    };
  } else if (diffDays <= 3) {
    return {
      urgency: 'warning' as const,
      diffDays,
      badgeText: diffDays === 0 ? 'หมดอายุวันนี้ !' : 'ใกล้หมดอายุแล้ว !',
      badgeClass: 'bg-amber-50 text-amber-600 border border-amber-200 font-semibold',
      cardBorder: 'border-amber-200 bg-amber-50/20',
    };
  } else {
    return {
      urgency: 'fresh' as const,
      diffDays,
      badgeText: `หมดอายุ ${formatThaiDate(expiryDateStr)}`,
      badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      cardBorder: 'border-slate-100 bg-white',
    };
  }
}

// Generate dates relative to today for realistic testing
function getDateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export const INITIAL_FOOD_ITEMS: FoodItem[] = [];

