import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AlgoWash | 내 유튜브 알고리즘 원터치 정화 유틸리티',
  description:
    '갑자기 유튜브 화면을 보여줘야 할 때, 10초 만에 강아지·고양이·인강·클래식·집밥 등 8가지 무해한 테마로 홈 피드를 덮어쓰고 언제든 되돌리세요.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AlgoWash',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#F4F6F9',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-dvh bg-[#F4F6F9] text-slate-900 antialiased selection:bg-emerald-500/20">
        {children}
      </body>
    </html>
  );
}
