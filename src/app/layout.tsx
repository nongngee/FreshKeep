import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FreshKeep',
  description: 'FreshKeep - แอปพลิเคชันจัดการตู้เย็น และแจ้งเตือนของหมดอายุผ่านอีเมล',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
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
        <link rel="icon" href="/logo.png" />
      </head>
      <body className="antialiased selection:bg-emerald-200 selection:text-emerald-900">
        {children}
      </body>
    </html>
  );
}
