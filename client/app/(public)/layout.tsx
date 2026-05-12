import Footer from "@/components/common/Footer";
import { Navbar } from "@/components/common/Navbar";
import { Providers } from "@/components/common/Providers";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Providers>
      <Navbar />
      {children}
      <Footer />
    </Providers>
  );
}
