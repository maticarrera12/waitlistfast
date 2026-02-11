  import type { Metadata } from "next";
import { Bebas_Neue, Geist, Geist_Mono, Raleway, Space_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar/comp-582";
import { Providers } from "@/components/providers";

const raleway = Raleway({subsets:['latin'],variable:'--font-sans'});
const bebasNeue = Bebas_Neue({weight:'400',subsets:['latin'],variable:'--font-bebas-neue'});
const spaceMono = Space_Mono({weight:'400',subsets:['latin'],variable:'--font-space-mono'});
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: {
    default: 'WaitlistFast — Launch faster. Grow virally.',
    template: '%s | WaitlistFast',
  },
  description:
    'Create high-converting waitlists with referrals, gamification, and custom templates. Launch faster and grow virally with WaitlistFast.',
  metadataBase: new URL('https://waitlistfast.vercel.app/'),

  openGraph: {
    type: 'website',
    siteName: 'WaitlistFast',
    title: 'WaitlistFast — Launch faster. Grow virally.',
    description:
      'Create high-converting waitlists with referrals, leaderboards, and rewards. Built for founders and startups.',
    url: 'https://waitlistfast.vercel.app/',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'WaitlistFast — Viral waitlists made simple',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'WaitlistFast — Launch faster. Grow virally.',
    description:
      'High-converting waitlists with referrals, gamification, and custom templates.',
    images: ['/og-image.png'],
    creator: '@waitlistfast', // opcional
  },

  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={raleway.variable}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${spaceMono.variable} ${bebasNeue.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}