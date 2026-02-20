import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || 'https://subscriptionincinerator.com'),
  title: {
    default: "Subscription Incinerator - Track & Cancel Unwanted Subscriptions",
    template: "%s | Subscription Incinerator",
  },
  description: "Stop overpaying for subscriptions you don't use. Automatically track, manage, and cancel unwanted subscriptions. Save money with smart reminders and AI-powered detection.",
  keywords: ["subscription manager", "cancel subscriptions", "track subscriptions", "subscription tracking", "save money", "recurring payments", "subscription cancellation"],
  authors: [{ name: "Subscription Incinerator" }],
  creator: "Subscription Incinerator",
  publisher: "Subscription Incinerator",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://subscriptionincinerator.com",
    siteName: "Subscription Incinerator",
    title: "Subscription Incinerator - Track & Cancel Unwanted Subscriptions",
    description: "Stop overpaying for subscriptions you don't use. Automatically track, manage, and cancel unwanted subscriptions.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Subscription Incinerator - Manage your subscriptions",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Subscription Incinerator - Track & Cancel Unwanted Subscriptions",
    description: "Stop overpaying for subscriptions you don't use.",
    images: ["/og-image.png"],
    creator: "@subscriptionincinerator",
  },
  verification: {
    google: "google-site-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
