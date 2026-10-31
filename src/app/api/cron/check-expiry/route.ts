import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { generateExpiryAlertEmailHtml } from '@/lib/email-template';
import { FoodItem } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    // 1. Verify Cron Secret (Vercel Cron sends Bearer token)
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const isTestParam = req.nextUrl.searchParams.get('test') === 'true';

    if (cronSecret && !isTestParam && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized: Invalid CRON_SECRET' }, { status: 401 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey || resendApiKey.startsWith('re_placeholder') || resendApiKey.startsWith('re_your')) {
      return NextResponse.json({
        error: 'RESEND_API_KEY is not configured',
      }, { status: 400 });
    }

    // 2. Connect to Supabase using Service Role Key (bypasses RLS to inspect all active items)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 3. Query all active food items from database
    const { data: foodData, error: foodError } = await supabase
      .from('food_items')
      .select('*')
      .eq('status', 'active');

    if (foodError) {
      console.error('Error fetching food items from Supabase:', foodError);
      return NextResponse.json({ error: foodError.message }, { status: 500 });
    }

    // If there are no active food items in the database at all
    if (!foodData || foodData.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'ไม่มีรายการอาหารที่กำลังใช้งานในตู้เย็น จึงไม่มีการส่งอีเมล',
        emailsSent: 0,
        itemsChecked: 0,
      });
    }

    // 4. Calculate date differences using Asia/Bangkok time (UTC+7)
    const now = new Date();
    const bangkokDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(now);
    const [tYear, tMonth, tDay] = bangkokDateStr.split('-').map(Number);
    const todayDate = new Date(tYear, tMonth - 1, tDay);

    // Group items by user_id
    const userItemsMap = new Map<string, { expiringSoon: FoodItem[]; expired: FoodItem[] }>();

    for (const item of foodData) {
      if (!item.expiry_date) continue;
      const [eYear, eMonth, eDay] = item.expiry_date.split('-').map(Number);
      const expiryDate = new Date(eYear, eMonth - 1, eDay);

      const diffTime = expiryDate.getTime() - todayDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      const mapped: FoodItem = {
        id: item.id,
        userId: item.user_id,
        name: item.name,
        categoryId: item.category_id || 'general',
        quantity: item.quantity || '1',
        unit: item.unit || 'ชิ้น',
        storageType: item.storage_type || 'chiller',
        purchaseDate: item.purchase_date || '',
        expiryDate: item.expiry_date,
        status: item.status,
        imageUrl: item.image_url,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      };

      const userId = item.user_id;
      if (!userItemsMap.has(userId)) {
        userItemsMap.set(userId, { expiringSoon: [], expired: [] });
      }
      const userBucket = userItemsMap.get(userId)!;

      // Rule:
      // - Expired: diffDays <= 0 (up to 14 days ago so we don't alert forever)
      // - Expiring soon: diffDays between 1 and 3 days
      if (diffDays <= 0 && diffDays >= -14) {
        userBucket.expired.push(mapped);
      } else if (diffDays > 0 && diffDays <= 3) {
        userBucket.expiringSoon.push(mapped);
      }
    }

    // 5. Send emails ONLY to users who have expiring or expired items
    const resend = new Resend(resendApiKey);
    const emailFrom = process.env.EMAIL_FROM || 'FreshKeep <onboarding@resend.dev>';
    const targetEmailParam = req.nextUrl.searchParams.get('to');

    let totalEmailsSent = 0;
    const sentDetails: any[] = [];

    for (const [userId, { expiringSoon, expired }] of userItemsMap.entries()) {
      // If this user has no items expiring soon and no expired items, SKIP! DO NOT SEND!
      if (expiringSoon.length === 0 && expired.length === 0) {
        continue;
      }

      // Fetch user profile from Supabase
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, display_name, email_notifications_enabled')
        .eq('id', userId)
        .maybeSingle();

      let recipientEmail = targetEmailParam || profile?.email;
      let recipientName = profile?.display_name || 'ผู้ใช้งาน FreshKeep';

      // Check if user turned off notifications
      if (!targetEmailParam && profile && profile.email_notifications_enabled === false) {
        continue;
      }

      // Fallback: check auth.users if profile is missing
      if (!recipientEmail) {
        try {
          const { data: authUser } = await supabase.auth.admin.getUserById(userId);
          recipientEmail = authUser?.user?.email;
          if (authUser?.user?.user_metadata?.full_name) {
            recipientName = authUser.user.user_metadata.full_name;
          }
        } catch (e) {
          console.warn('Could not fetch auth user for id:', userId);
        }
      }

      // Fallback default email if not resolved
      if (!recipientEmail) {
        recipientEmail = 'whanidcha@gmail.com';
      }

      const emailHtml = generateExpiryAlertEmailHtml({
        userName: recipientName,
        userEmail: recipientEmail,
        expiringSoonItems: expiringSoon,
        expiredItems: expired,
      });

      const totalItems = expiringSoon.length + expired.length;
      const sendResult = await resend.emails.send({
        from: emailFrom,
        to: [recipientEmail],
        subject: `🥬 [FreshKeep] แจ้งเตือน: มีอาหารในตู้เย็น ${totalItems} รายการใกล้หมดอายุหรือหมดอายุแล้ว!`,
        html: emailHtml,
      });

      totalEmailsSent++;
      sentDetails.push({
        userId,
        recipient: recipientEmail,
        expiringSoonCount: expiringSoon.length,
        expiredCount: expired.length,
        sendResult,
      });
    }

    // 6. Return response
    if (totalEmailsSent === 0) {
      return NextResponse.json({
        success: true,
        message: 'ตรวจสอบเรียบร้อย: ไม่มีอาหารที่ใกล้หมดอายุ (ภายใน 3 วัน) หรือหมดอายุในวันนี้ จึงไม่มีการส่งอีเมล',
        emailsSent: 0,
        itemsChecked: foodData.length,
      });
    }

    return NextResponse.json({
      success: true,
      message: `ส่งอีเมลแจ้งเตือนสำเร็จจำนวน ${totalEmailsSent} ฉบับ`,
      emailsSent: totalEmailsSent,
      details: sentDetails,
    });
  } catch (error: any) {
    console.error('Error in cron/check-expiry:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
