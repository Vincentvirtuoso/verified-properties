import type { Metadata } from "next";
import { Geist_Mono, Lato } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { SavedPropertiesProvider } from "@/contexts/SavedPropertiesContext";
import { ConfirmationProvider } from "@/contexts/ConfirmDialog";
import {
  SIDEBAR_COLLAPSED_WIDTH,
  SIDEBAR_EXPANDED_WIDTH,
} from "@/utils/constants";
import { CSSProperties } from "react";

const lato = Lato({
  variable: "--font-lato-sans",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Verified Properties",
  description: "Properties unlimited",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${lato.variable} ${geistMono.variable} h-full antialiased`}
      style={
        {
          "--sidebar-width-expanded": `${SIDEBAR_EXPANDED_WIDTH}px`,
          "--sidebar-width-collapsed": `${SIDEBAR_COLLAPSED_WIDTH}px`,
        } as CSSProperties
      }
    >
      <body className="min-h-full flex flex-col antialiased selection:bg-primary/20">
        <AuthProvider>
          <SavedPropertiesProvider>
          <ConfirmationProvider>{children}</ConfirmationProvider>
        </SavedPropertiesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
