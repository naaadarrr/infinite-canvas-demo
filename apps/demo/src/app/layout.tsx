import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '@tc/infinite - Infinite Canvas Demo',
  description: 'Demo for @tc/infinite canvas library',
  icons: {
    icon: '/Gemini_Generated_infinity_Image_aa0lzhaa0lzhaa0l.png',
    shortcut: '/Gemini_Generated_infinity_Image_aa0lzhaa0lzhaa0l.png',
    apple: '/Gemini_Generated_infinity_Image_aa0lzhaa0lzhaa0l.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body style={{ width: '100vw', height: '100vh' }}>{children}</body>
    </html>
  );
}
