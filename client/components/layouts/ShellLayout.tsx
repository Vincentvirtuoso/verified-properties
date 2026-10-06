import { Navbar } from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { Providers } from "@/components/common/Providers";

export default function ShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Providers>
      <Navbar />
      <div className="min-h-[80vh]">{children}</div>
      <Footer />
    </Providers>
  );
}
