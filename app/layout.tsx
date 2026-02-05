import type { Metadata } from "next";
import { Bebas_Neue, Geist, Geist_Mono, Raleway, Space_Mono } from "next/font/google";
import "./globals.css";

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
  title: "WaitlistFast | Waitlist Management Software",
  description: "WaitlistFast is a waitlist management software that allows you to manage your waitlist and track your customers.",
};

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
          {children}
      </body>
    </html>
  );
}