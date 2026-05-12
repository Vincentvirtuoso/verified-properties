"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "../ui/Button";
import { LuMenu, LuUser } from "react-icons/lu";
import { useBannerHeightContext } from "@/contexts/BannerHeightContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Brandmark } from "./BrandMark";

const navLinks = [
  { href: "/properties?type=sale", label: "Buy" },
  { href: "/properties?type=rent", label: "Rent" },
  { href: "/brokers", label: "JV Insist Pro" },
  { href: "/academy", label: "Learn Real Estate" },
  { href: "/agent/properties/new", label: "Sell & Let" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const { bannerHeight } = useBannerHeightContext();
  const { toggleOpen, isCollapsed } = useSidebar();
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`
        sticky z-40 w-full transition-all duration-500 ease-in-out border-b
        ${
          isScrolled
            ? "bg-navbar-bg/80 backdrop-blur-md shadow-md border-border/50"
            : "bg-navbar-bg border-transparent"
        }
      `}
      style={{
        top: bannerHeight,
        transitionProperty: "top, background-color, border-color, box-shadow",
      }}
    >
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <div className="flex items-center gap-4">
            {!isDesktop && (
              <button
                onClick={toggleOpen}
                className="p-2 -ml-2 rounded-xl hover:bg-sidebar-hover-bg transition-colors active:scale-95 text-navbar-foreground"
                aria-label="Open navigation"
              >
                <LuMenu className="w-6 h-6" />
              </button>
            )}
            <Brandmark taglineOnly={isDesktop && !isCollapsed} />
          </div>

          <div className="hidden lg:flex items-center bg-muted/50 rounded-full px-1 py-1 border border-foreground">
            {navLinks.map(({ href, label }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`
                    px-4 py-2 text-sm font-medium rounded-full transition-all
                    ${
                      isActive
                        ? "bg-background text-primary shadow-sm border border-border"
                        : "text-navbar-foreground/70 hover:text-primary hover:bg-sidebar-hover-bg"
                    }
                  `}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-3">
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-semibold text-navbar-foreground hover:text-primary"
                >
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="sm"
                  className="font-semibold px-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
                >
                  List Property
                </Button>
              </Link>
            </div>

            <Link
              href="/login"
              className="md:hidden p-2 rounded-full hover:bg-sidebar-hover-bg text-navbar-foreground"
            >
              <LuUser className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
