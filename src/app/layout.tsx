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
  // Remove icons from metadata to prevent conflicts with manual head links
  manifest: '/manifest.json',
  metadataBase: new URL('https://mirrornet.net'),
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
  other: {
    'cache-control': 'no-cache, no-store, must-revalidate',
    'pragma': 'no-cache',
    'expires': '0',
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
        <meta name="cache-control" content="no-cache, no-store, must-revalidate" />
        <meta name="pragma" content="no-cache" />
        <meta name="expires" content="0" />
        {/* Enhanced SEO and Social Media Meta Tags */}
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        <meta name="application-name" content="MirrorNet™" />
        <meta name="apple-mobile-web-app-title" content="MirrorNet™" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="canonical" href="https://mirrornet.net" />
        {/* NUCLEAR FAVICON OVERRIDE - Multiple declarations to force Vercel compliance */}
        <link rel="icon" href="/favicon.ico?v=5&t=1735059600&force=true" type="image/x-icon" sizes="any" />
        <link rel="shortcut icon" href="/favicon.ico?v=5&t=1735059600&force=true" type="image/x-icon" />
        <link rel="icon" href="/favicon.ico?v=5&t=1735059600&force=true" type="image/vnd.microsoft.icon" />
        <link rel="icon" href="/mirrornet-logo.png?v=5&t=1735059600&force=true" type="image/png" sizes="32x32" />
        <link rel="icon" href="/mirrornet-logo.png?v=5&t=1735059600&force=true" type="image/png" sizes="16x16" />
        <link rel="icon" href="/mirrornet-logo.png?v=5&t=1735059600&force=true" type="image/png" sizes="48x48" />
        <link rel="icon" href="/mirrornet-logo.png?v=5&t=1735059600&force=true" type="image/png" sizes="64x64" />
        <link rel="apple-touch-icon" href="/mirrornet-logo.png?v=5&t=1735059600&force=true" sizes="180x180" />
        <link rel="apple-touch-icon" href="/mirrornet-logo.png?v=5&t=1735059600&force=true" sizes="152x152" />
        <link rel="apple-touch-icon" href="/mirrornet-logo.png?v=5&t=1735059600&force=true" sizes="120x120" />
        <link rel="apple-touch-icon" href="/mirrornet-logo.png?v=5&t=1735059600&force=true" sizes="76x76" />
        <meta name="msapplication-TileImage" content="/mirrornet-logo.png?v=5&t=1735059600&force=true" />
        <meta name="msapplication-TileColor" content="#8B5CF6" />
        <meta name="theme-color" content="#8B5CF6" />
        {/* Force refresh favicon cache */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        {/* Nuclear option: Runtime favicon injection */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Remove any existing favicons
                var links = document.querySelectorAll('link[rel*="icon"]');
                links.forEach(function(link) { link.remove(); });
                
                // Add our favicon with maximum priority
                var favicon = document.createElement('link');
                favicon.rel = 'icon';
                favicon.type = 'image/x-icon';
                favicon.href = '/favicon.ico?v=5&t=' + Date.now() + '&force=true';
                document.head.insertBefore(favicon, document.head.firstChild);
                
                // Add PNG version
                var pngIcon = document.createElement('link');
                pngIcon.rel = 'icon';
                pngIcon.type = 'image/png';
                pngIcon.sizes = '32x32';
                pngIcon.href = '/mirrornet-logo.png?v=5&t=' + Date.now() + '&force=true';
                document.head.insertBefore(pngIcon, document.head.firstChild);
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}