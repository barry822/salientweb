import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

// Google Analytics 4: paste your Measurement ID (G-XXXXXXXXXX) to switch it on.
const GA_ID = '';

// Self-hosted at build time, so visitors don't fetch fonts from Google.
const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' });

const SHARE_TITLE = 'Salient: We build your pipeline. You close the deals.';
const SHARE_DESC = 'Managed, multi-channel B2B outbound. Pay for qualified meetings, not SDR headcount.';

export const metadata: Metadata = {
  metadataBase: new URL('https://salientco.in'),
  title: 'Managed B2B Outbound & Lead Generation Agency | Salient',
  description:
    'Salient runs your B2B outbound end to end: cold calling, email and LinkedIn outreach that books qualified sales meetings. Pay for outcomes, not headcount.',
  robots: { index: true, follow: true, 'max-image-preview': 'large' },
  alternates: { canonical: '/' },
  icons: {
    icon: [
      { url: '/assets/favicon.svg', type: 'image/svg+xml' },
      { url: '/assets/favicon.png', sizes: '512x512', type: 'image/png' },
      { url: '/assets/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/assets/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Salient',
    locale: 'en_IN',
    title: SHARE_TITLE,
    description: SHARE_DESC,
    images: [{ url: '/assets/og-image.png', width: 1200, height: 630, alt: SHARE_TITLE }],
  },
  twitter: { card: 'summary_large_image', title: SHARE_TITLE, description: SHARE_DESC, images: ['/assets/og-image.png'] },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#090B22',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable}>
      <body>
        {children}
        {GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="ga" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
