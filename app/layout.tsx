import type { Metadata } from 'next';
import { Bricolage_Grotesque, DM_Mono } from 'next/font/google';
import { pageMetadata, SITE_NAME, SITE_URL } from '@/lib/site';
import './globals.css';

const bricolage = Bricolage_Grotesque({
  variable: '--font-bricolage',
  subsets: ['latin'],
  weight: ['500', '700', '800'],
  display: 'swap',
});

const dmMono = DM_Mono({
  variable: '--font-dm-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  ...pageMetadata(SITE_NAME, { full: true }),
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${bricolage.variable} ${dmMono.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
