import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/hooks/useAuth';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Ruhi AI — Intelligent Companion Platform',
  description:
    'Think, create, learn, and get things done with your personal AI companion. Featuring multi-model intelligence, deep vector RAG, live web research, and neural tools.',
  keywords: [
    'Ruhi AI',
    'Personal AI Assistant',
    'Gemini 2.5 Flash',
    'Deep Reasoning',
    'Document RAG',
    'Vector Search',
    'Razorpay Subscriptions',
  ],
  authors: [{ name: 'Ruhi AI Engineering Team' }],
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased" data-theme="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-full flex flex-col bg-[#090d16] text-slate-100 font-sans`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
