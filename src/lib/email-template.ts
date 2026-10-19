import { FoodItem } from './types';
import { formatThaiDate } from './mock-data';

interface EmailAlertParams {
  userName: string;
  userEmail: string;
  expiringSoonItems: FoodItem[];
  expiredItems: FoodItem[];
}

export function generateExpiryAlertEmailHtml({
  userName,
  expiringSoonItems,
  expiredItems,
}: EmailAlertParams): string {
  const totalItems = expiringSoonItems.length + expiredItems.length;

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FreshKeep - แจ้งเตือนของในตู้เย็นใกล้หมดอายุ</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f7f4; margin: 0; padding: 20px; color: #1e293b; }
    .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.06); border: 1px solid #d1fae5; }
    .header { background: linear-gradient(135deg, #059669, #10b981); padding: 30px 24px; text-align: center; color: #ffffff; }
    .logo-title { font-size: 24px; font-weight: 800; margin: 8px 0 0; letter-spacing: -0.5px; }
    .tagline { font-size: 13px; opacity: 0.9; margin: 4px 0 0; }
    .content { padding: 24px; }
    .greeting { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 8px; }
    .desc { font-size: 14px; color: #64748b; line-height: 1.5; margin-bottom: 20px; }
    .section-title { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin: 20px 0 10px; display: flex; align-items: center; gap: 6px; }
    .title-warning { color: #d97706; }
    .title-danger { color: #dc2626; }
    .item-card { background: #f8fafc; border-radius: 12px; padding: 12px 14px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #e2e8f0; }
    .item-card.warning { border-left: 4px solid #f59e0b; background: #fffbeb; }
    .item-card.danger { border-left: 4px solid #ef4444; background: #fef2f2; }
    .item-name { font-weight: 600; font-size: 14px; color: #1e293b; }
    .item-meta { font-size: 12px; color: #64748b; margin-top: 2px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; }
    .badge-warning { background: #fef3c7; color: #92400e; }
    .badge-danger { background: #fee2e2; color: #991b1b; }
    .btn-container { text-align: center; margin: 28px 0 16px; }
    .btn { display: inline-block; background: #059669; color: #ffffff !important; text-decoration: none; padding: 12px 32px; border-radius: 9999px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 12px rgba(5,150,105,0.25); }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; background: #fafafa; }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div style="font-size: 38px;">🥬🧊</div>
      <div class="logo-title">FreshKeep Alert</div>
      <div class="tagline">เตือนความสด ตรวจสอบตู้เย็นก่อนของจะเสีย</div>
    </div>

    <!-- Content -->
    <div class="content">
      <div class="greeting">สวัสดีคุณ ${userName} 👋</div>
      <div class="desc">
        เช้านี้ระบบตรวจพบอาหารในตู้เย็นของคุณที่ถึงเวลาต้องรีบจัดการจำนวน <strong>${totalItems} รายการ</strong> เพื่อสุขอนามัยและลดการทิ้งอาหารครับ:
      </div>

      ${
        expiringSoonItems.length > 0
          ? `
        <div class="section-title title-warning">
          ⏰ อาหารใกล้หมดอายุ (ภายใน 3 วัน)
        </div>
        ${expiringSoonItems
          .map(
            (item) => `
          <div class="item-card warning">
            <div>
              <div class="item-name">${item.name} (${item.quantity} ${item.unit})</div>
              <div class="item-meta">ช่องจัดเก็บ: ${
                item.storageType === 'freezer'
                  ? 'ช่องฟรีซ'
                  : item.storageType === 'pantry'
                  ? 'อุณหภูมิห้อง'
                  : 'ช่องธรรมดา'
              } | หมดอายุ: ${formatThaiDate(item.expiryDate)}</div>
            </div>
            <div class="badge badge-warning">รีบทานด่วน</div>
          </div>
        `
          )
          .join('')}
      `
          : ''
      }

      ${
        expiredItems.length > 0
          ? `
        <div class="section-title title-danger" style="margin-top: 20px;">
          🚨 อาหารหมดอายุแล้ววันนี้
        </div>
        ${expiredItems
          .map(
            (item) => `
          <div class="item-card danger">
            <div>
              <div class="item-name">${item.name} (${item.quantity} ${item.unit})</div>
              <div class="item-meta">วันหมดอายุที่ระบุ: ${formatThaiDate(item.expiryDate)}</div>
            </div>
            <div class="badge badge-danger">หมดอายุแล้ว</div>
          </div>
        `
          )
          .join('')}
      `
          : ''
      }

      <!-- Call to Action -->
      <div class="btn-container">
        <a href="http://localhost:3000" class="btn">เปิดดูตู้เย็นของคุณ</a>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      ส่งโดยอัตโนมัติจากระบบ <strong>FreshKeep</strong><br>
      คุณได้รับอีเมลนี้เนื่องจากเปิดการแจ้งเตือนอาหารในตู้เย็นไว้
    </div>
  </div>
</body>
</html>
  `.trim();
}
