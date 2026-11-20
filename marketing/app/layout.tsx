import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "./globals.css";
import "@fontsource/lato/400.css";
import "@fontsource/lato/700.css";
import "@fontsource-variable/geist-mono";
import { CSSProperties } from "react";
import "leaflet/dist/leaflet.css";

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
      className="h-full antialiased"
      style={
        {
          "--font-lato-sans": '"Lato", Arial, sans-serif',
          "--font-geist-mono":
            '"Geist Mono Variable", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        } as CSSProperties
      }
    >
      <body className="min-h-full flex flex-col antialiased selection:bg-primary/20">
        {children}
      </body>
    </html>
  );
}
