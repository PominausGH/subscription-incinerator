import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import fs from 'fs';
import path from 'path';
import { getMarketingFixes } from "@/lib/marketing-sync";

const SITE_URL = "https://subscriptionincinerator.app";
const SITE_NAME = "Subscription Incinerator";
const DEFAULT_TITLE = "Subscription Incinerator - Track & Cancel Forgotten Subscriptions Free";
const DEFAULT_DESCRIPTION = "Stop paying for subscriptions you forgot about. Automatically finds trials and recurring charges, then reminds you before you get charged. 100% free.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: "%s — Subscription Incinerator",
  },
  description: DEFAULT_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Load Marketing Fixes from JSON Files (.marketing-os directory)
  const marketingFixes = getMarketingFixes();

  // Load Legacy Growth Overrides
  let overrides: Record<string, string> = {};
  try {
    const storagePath = path.join(process.cwd(), 'src/lib/marketing/overrides.json');
    if (fs.existsSync(storagePath)) {
      overrides = JSON.parse(fs.readFileSync(storagePath, 'utf8'));
    }
  } catch (e) {
    console.error('Failed to load growth overrides');
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Marketing OS - Injected Fixes */}
        {marketingFixes.map((fix: any) => (
          <script
            key={fix.fixId}
            dangerouslySetInnerHTML={{ __html: fix.code.replace(/<\/?script[^>]*>/g, '') }}
          />
        ))}

        {/* Dynamic SEO Injection (Legacy) */}
        {Object.entries(overrides).map(([id, code]) => (
          <script
            key={id}
            id={`growth-override-${id}`}
            dangerouslySetInnerHTML={{ 
              __html: `
                (function() {
                  const div = document.createElement('div');
                  div.innerHTML = \`${code}\`;
                  Array.from(div.childNodes).forEach(node => {
                    if (node.tagName === 'SCRIPT') {
                      const s = document.createElement('script');
                      s.textContent = node.textContent;
                      document.head.appendChild(s);
                    } else {
                      document.head.appendChild(node);
                    }
                  });
                })();
              `
            }}
          />
        ))}

        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('si-theme')||'dark';document.documentElement.classList.toggle('dark',t==='dark')})()`,
          }}
        />
        <script defer src="/_a/script.js" data-website-id="60a4cf03-e028-457e-a6e0-a61b6ad4c083"></script>
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
