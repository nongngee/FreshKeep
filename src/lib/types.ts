export type StorageType = 'chiller' | 'freezer' | 'pantry';

export type FoodStatus = 'active' | 'consumed' | 'discarded';

export type ExpiryUrgency = 'fresh' | 'warning' | 'expired';

export interface Category {
  id: string;
  nameTh: string;
  nameEn: string;
  icon: string;
  color: string;
}

export interface FoodItem {
  id: string;
  userId: string;
  name: string;
  categoryId: string;
  quantity: string;
  unit: string;
  storageType: StorageType;
  purchaseDate: string; // YYYY-MM-DD
  expiryDate: string;   // YYYY-MM-DD
  status: FoodStatus;
  notes?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  notifyDaysBefore: number;
  emailNotificationsEnabled: boolean;
}

export interface ExpiryCalculation {
  urgency: ExpiryUrgency;
  daysRemaining: number;
  badgeText: string;
  badgeClass: string;
}
