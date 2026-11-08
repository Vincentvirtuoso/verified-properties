import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "./globals.css";
import "@fontsource/lato/400.css";
import "@fontsource/lato/700.css";
import "@fontsource-variable/geist-mono";
import { AuthProvider } from "@/contexts/AuthContext";
import { SavedPropertiesProvider } from "@/contexts/SavedPropertiesContext";
import { ConfirmationProvider } from "@/contexts/ConfirmDialog";
import { SIDEBAR_COLLAPSED_WIDTH, SIDEBAR_EXPANDED_WIDTH } from "@/utils";
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
