import type { Metadata } from "next";
import { Geist_Mono, Lato } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ConfirmationProvider } from "@/contexts/ConfirmDialog";

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
    >
      <body className="min-h-full flex flex-col antialiased selection:bg-primary/20">
        <AuthProvider>
          <ConfirmationProvider>{children}</ConfirmationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
