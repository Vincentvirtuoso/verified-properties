import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "./globals.css";
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
          "--font-lato-sans": '"Inter Variable", Inter, Arial, sans-serif',
          "--font-geist-mono":
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
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
