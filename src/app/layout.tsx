import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClientProviders } from '@/components/providers/client-providers';

import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MirrorNet™ - Personal Growth Through Feedback',
  description: 'Receive structured, anonymous feedback from different circles in your life',
  keywords: 'personal growth, feedback, self-improvement, 360 review, personality traits, circles',
  authors: [{ name: 'MirrorNet™' }],
  creator: 'MirrorNet™',
  publisher: 'MirrorNet™',
  manifest: '/manifest.json',
  metadataBase: new URL('https://mirrornet.net'),
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/mirrornet-logo.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: '/mirrornet-logo.png',
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'MirrorNet™ - Personal Growth Through Feedback',
    description: 'The honest, anonymous feedback platform for personal growth and stronger relationships',
    url: 'https://mirrornet.net',
    siteName: 'MirrorNet™',
    images: [
      {
        url: '/mirrornet-logo.png',
        width: 1200,
        height: 630,
        alt: 'MirrorNet™ Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MirrorNet™ - Personal Growth Through Feedback',
    description: 'The honest, anonymous feedback platform for personal growth and stronger relationships',
    images: ['/mirrornet-logo.png'],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#8b5cf6',
  colorScheme: 'dark',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Enhanced SEO and PWA Meta Tags */}
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        <meta name="application-name" content="MirrorNet™" />
        <meta name="apple-mobile-web-app-title" content="MirrorNet™" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="msapplication-TileColor" content="#8B5CF6" />
        <meta name="theme-color" content="#8B5CF6" />
      </head>
      <body className={inter.className}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}