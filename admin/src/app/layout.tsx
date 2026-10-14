import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import { Providers } from "@/providers/Providers";

import "./globals.css";
import {
  SIDEBAR_COLLAPSED_WIDTH,
  SIDEBAR_EXPANDED_WIDTH,
} from "@affilhomes/shared/utils";
import { CSSProperties } from "react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s · Admin",
  },
  description: "Internal administration console",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={inter.variable}
      suppressHydrationWarning
      style={
        {
          "--sidebar-width-expanded": `${SIDEBAR_EXPANDED_WIDTH}px`,
          "--sidebar-width-collapsed": `${SIDEBAR_COLLAPSED_WIDTH}px`,
        } as CSSProperties
      }
    >
      <body className="min-h-screen font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
