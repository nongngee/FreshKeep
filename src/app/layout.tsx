import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FreshKeep - จัดการตู้เย็น & แจ้งเตือนของหมดอายุ',
  description: 'เว็บแอปพลิเคชันสำหรับจัดการตู้เย็น แจ้งเตือนอาหารใกล้หมดอายุผ่านอีเมล',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body className="antialiased selection:bg-emerald-200 selection:text-emerald-900">
        {children}
      </body>
    </html>
  );
}
