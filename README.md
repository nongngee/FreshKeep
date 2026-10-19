# 🥬 FreshKeep - Refrigerator Food Management & Expiry Alert

เว็บแอปพลิเคชันจัดการตู้เย็น และส่งอีเมลแจ้งเตือนอาหารใกล้หมดอายุหรือหมดอายุแล้วอัตโนมัติ

---

## 🚀 วิธีเริ่มใช้งานทันที (Quick Start)

เปิด Terminal ในโฟลเดอร์นี้แล้วพิมพ์คำสั่ง:

```bash
npm run dev
```

เปิดเบราว์เซอร์ไปที่: **[http://localhost:3000](http://localhost:3000)**

---

## ✨ สิ่งที่ทำเสร็จแล้วใน Phase 1 - 4:

1. **Phase 1: โครงสร้างโปรเจกต์ & ฐานข้อมูล**
   * Next.js (App Router, TypeScript) + Tailwind CSS
   * สคริปต์ `supabase_schema.sql` พร้อมนำไปสร้างตารางใน Supabase ได้ในคลิกเดียว (มีตาราง `profiles`, `categories`, `food_items`, `notification_logs` และ RLS)
   * Template ตัวแปรสภาพแวดล้อม `.env.local.example`

2. **Phase 2: หน้าจอ UI ถอดแบบจาก Figma 100%**
   * **หน้าแรก (Landing / Sign-in):** ไอคอนมาสคอตตู้เย็น FreshKeep สุดน่ารัก พร้อมปุ่ม "เปิดตู้เย็นเลย" และจำลองการล็อกอิน Google
   * **หน้า Dashboard ตู้เย็น:**
     * แสดงรายการอาหารพร้อมตัวบ่งชี้สถานะสี:
       * 🟢 **สีเขียว:** ของสดยังดี (แสดงวันหมดอายุในรูปแบบ พ.ศ.)
       * 🟡 **สีส้ม:** ใกล้หมดอายุแล้ว (เหลือ 1-3 วัน)
       * 🔴 **สีแดง:** หมดอายุแล้ว
     * แถบกรองหมวดหมู่ (ทั้งหมด, ใกล้หมดอายุ, หมดอายุแล้ว, ช่องฟรีซ, ของสดยังดี)
     * ช่องค้นหาชื่ออาหาร
     * ปุ่ม **"เพิ่มอาหาร +"** แบบลอยที่ด้านล่างหน้าจอ
     * Modal สำหรับเพิ่มและแก้ไขรายการอาหาร
     * ระบบบันทึกข้อมูลแบบ LocalStorage ทันที (ไม่ต้องรอต่อฐานข้อมูลก็ทดสอบได้)

3. **Phase 3: ระบบส่งอีเมลแจ้งเตือน (Email Notification)**
   * Email Template HTML สวยงาม รองรับทั้งมือถือและคอมพิวเตอร์
   * หน้าพรีวิวอีเมลที่ **[http://localhost:3000/preview-email](http://localhost:3000/preview-email)** พร้อมปุ่มกดทดสอบส่ง

4. **Phase 4: ระบบ Cron Job อัตโนมัติ**
   * ไฟล์ `vercel.json` ตั้งเวลาให้ระบบรันตรวจสอบวันหมดอายุทุกเช้าเวลา 08:00 น.
   * API Endpoint: `/api/cron/check-expiry` พร้อมระบบรักษาความปลอดภัย `CRON_SECRET` และป้องกันการส่งอีเมลซ้ำ

---

## 🔑 เมื่อพร้อมเริ่ม Phase 5 (เชื่อมต่อบริการจริง):

1. **สร้างฐานข้อมูล Supabase:**
   * สมัครฟรีที่ [supabase.com](https://supabase.com)
   * ไปที่เมนู **SQL Editor** แล้วก๊อปปี้โค้ดในไฟล์ `supabase_schema.sql` ไปวางแล้วกด **Run**
   * ไปที่ **Project Settings > API** คัดลอก `Project URL` และ `anon key`
2. **เปิด Google Login:**
   * ไปที่ **Authentication > Providers > Google** ใน Supabase แล้วเปิดใช้งาน
3. **สมัครส่งอีเมล Resend:**
   * สมัครฟรีที่ [resend.com](https://resend.com) (ส่งฟรี 3,000 ฉบับ/เดือน) แล้วคัดลอก API Key
4. **สร้างไฟล์ `.env.local`:**
   * คัดลอกจาก `.env.local.example` แล้วนำ Key ทั้งหมดมาวาง
