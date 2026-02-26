import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Subscription Incinerator - Track & Cancel Forgotten Subscriptions Free",
  description: "Stop paying for subscriptions you forgot about. Automatically finds trials and recurring charges, then reminds you before you get charged. 100% free.",
  keywords: "subscription tracker, cancel subscriptions, subscription manager, free trial reminder, subscription spending tracker",
  openGraph: {
    type: "website",
    url: "https://subscriptionincinerator.app/",
    title: "Subscription Incinerator - Track & Cancel Forgotten Subscriptions Free",
    description: "Stop paying for subscriptions you forgot about. Automatically finds trials and recurring charges, then reminds you before you get charged.",
    siteName: "Subscription Incinerator",
  },
  twitter: {
    card: "summary_large_image",
    title: "Subscription Incinerator - Track & Cancel Forgotten Subscriptions Free",
    description: "Stop paying for subscriptions you forgot about. Automatically find and cancel unwanted subscriptions.",
  },
  alternates: {
    canonical: "https://subscriptionincinerator.app/",
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
