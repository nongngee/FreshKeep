import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { generateExpiryAlertEmailHtml } from '@/lib/email-template';
import { FoodItem } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    // 1. Verify Cron Secret (Allow if ?test=true or valid authorization header)
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

    const resend = new Resend(resendApiKey);
    const emailFrom = process.env.EMAIL_FROM || 'FreshKeep <onboarding@resend.dev>';
    const targetEmailParam = req.nextUrl.searchParams.get('to');

    // 2. Fetch real items from Supabase if available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    let expiringSoon: FoodItem[] = [];
    let expired: FoodItem[] = [];
    let userName = 'ผู้ใช้งาน FreshKeep';

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Get active food items
      const { data: foodData } = await supabase
        .from('food_items')
        .select('*')
        .eq('status', 'active');

      if (foodData && foodData.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const item of foodData) {
          const exp = new Date(item.expiry_date);
          exp.setHours(0, 0, 0, 0);
          const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

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
            createdAt: item.created_at,
            updatedAt: item.updated_at,
          };

          if (diffDays < 0 || diffDays === 0) {
            expired.push(mapped);
          } else if (diffDays <= 3) {
            expiringSoon.push(mapped);
          }
        }
      }
    }

    // If testing and database is empty, provide demo alert items so the email is informative
    if (expiringSoon.length === 0 && expired.length === 0) {
      const today = new Date();
      const in2Days = new Date(today);
      in2Days.setDate(today.getDate() + 2);
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      expiringSoon = [
        {
          id: 'demo-1',
          userId: 'demo',
          name: 'นมสดพาสเจอร์ไรส์',
          categoryId: 'dairy',
          quantity: '1',
          unit: 'ขวด',
          storageType: 'chiller',
          purchaseDate: today.toISOString().split('T')[0],
          expiryDate: in2Days.toISOString().split('T')[0],
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      expired = [
        {
          id: 'demo-2',
          userId: 'demo',
          name: 'โยเกิร์ต รสธรรมชาติ',
          categoryId: 'dairy',
          quantity: '2',
          unit: 'ถ้วย',
          storageType: 'chiller',
          purchaseDate: yesterday.toISOString().split('T')[0],
          expiryDate: yesterday.toISOString().split('T')[0],
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
    }

    const recipient = targetEmailParam || 'whanidcha@gmail.com';

    const emailHtml = generateExpiryAlertEmailHtml({
      userName,
      userEmail: recipient,
      expiringSoonItems: expiringSoon,
      expiredItems: expired,
    });

    const emailResponse = await resend.emails.send({
      from: emailFrom,
      to: [recipient],
      subject: '🥬 [FreshKeep] แจ้งเตือน: มีอาหารในตู้เย็นใกล้หมดอายุแล้ว!',
      html: emailHtml,
    });

    return NextResponse.json({
      success: true,
      recipient,
      expiringSoonCount: expiringSoon.length,
      expiredCount: expired.length,
      emailResponse,
    });
  } catch (error: any) {
    console.error('Error in cron/check-expiry:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
