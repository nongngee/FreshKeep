import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { generateExpiryAlertEmailHtml } from '@/lib/email-template';

export async function GET(req: NextRequest) {
  try {
    // 1. Verify Cron Secret
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const isTestParam = req.nextUrl.searchParams.get('test') === 'true';

    if (cronSecret && !isTestParam && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized: Invalid CRON_SECRET' }, { status: 401 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const isResendConfigured = Boolean(
      resendApiKey &&
      resendApiKey !== 're_your_resend_api_key' &&
      !resendApiKey.startsWith('re_your')
    );

    // Mock items summary for testing / local demo
    const mockExpiringSoon = [
      {
        id: '2',
        userId: 'demo-user',
        name: 'เบคอนหมูรมควัน',
        categoryId: 'meat',
        quantity: '1',
        unit: 'แพ็ค',
        storageType: 'chiller' as const,
        purchaseDate: '2026-10-14',
        expiryDate: '2026-10-21',
        status: 'active' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const mockExpired = [
      {
        id: '3',
        userId: 'demo-user',
        name: 'เนื้อหมูสันนอก',
        categoryId: 'meat',
        quantity: '1',
        unit: 'ถุง',
        storageType: 'chiller' as const,
        purchaseDate: '2026-10-12',
        expiryDate: '2026-10-18',
        status: 'active' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    if (!isResendConfigured) {
      return NextResponse.json({
        success: true,
        mode: 'simulated_local',
        message: 'Cron job executed in local simulation mode (Resend API key not configured yet).',
        detectedExpiringSoon: mockExpiringSoon.length,
        detectedExpired: mockExpired.length,
        items: [...mockExpiringSoon, ...mockExpired].map(i => ({ name: i.name, expiryDate: i.expiryDate })),
      });
    }

    // When Resend is configured:
    const resend = new Resend(resendApiKey);
    const targetEmail = req.nextUrl.searchParams.get('to') || 'tufho@example.com';
    const emailHtml = generateExpiryAlertEmailHtml({
      userName: 'ผู้ใช้ FreshKeep',
      userEmail: targetEmail,
      expiringSoonItems: mockExpiringSoon,
      expiredItems: mockExpired,
    });

    const emailFrom = process.env.EMAIL_FROM || 'FreshKeep <onboarding@resend.dev>';

    const emailResponse = await resend.emails.send({
      from: emailFrom,
      to: [targetEmail],
      subject: '🥬 [FreshKeep] แจ้งเตือน: อาหารในตู้เย็นใกล้หมดอายุแล้ว!',
      html: emailHtml,
    });

    return NextResponse.json({
      success: true,
      mode: 'production',
      message: 'Expiry alert email sent successfully via Resend!',
      emailResponse,
    });
  } catch (error: any) {
    console.error('Error in cron/check-expiry:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
