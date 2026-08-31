import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: '이산구조 공부방 | CSE1312',
  description: '명제논리부터 그래프 이론까지, 주차별로 이해하고 연습하는 이산구조 학습 사이트',
  openGraph: {
    title: '이산구조 공부방',
    description: '명제논리부터 그래프 이론까지',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: '이산구조 공부방' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '이산구조 공부방',
    description: '명제논리부터 그래프 이론까지',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
    </html>
  );
}
