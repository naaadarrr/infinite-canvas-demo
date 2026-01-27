import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '@tc/infinite - Infinite Canvas Demo',
  description: 'Demo for @tc/infinite canvas library',
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
