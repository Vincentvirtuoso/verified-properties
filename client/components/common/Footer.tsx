import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-sidebar-bg border-t border-border pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <Link
              href="/"
              className="flex items-center group"
              aria-label="VerifiedProperties Home"
            >
              <span className="text-2xl md:text-2xl font-extrabold tracking-tight">
                <span className="text-primary group-hover:text-primary/90 transition-colors">
                  Verified
                </span>
                <span className="text-orange-500 group-hover:text-orange-600 transition-colors">
                  Properties
                </span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Nigeria's most trusted real estate platform.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Explore</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/properties"
                  className="hover:text-primary transition-colors"
                >
                  All Properties
                </Link>
              </li>
              <li>
                <Link
                  href="/properties?type=sale"
                  className="hover:text-primary transition-colors"
                >
                  For Sale
                </Link>
              </li>
              <li>
                <Link
                  href="/properties?type=rent"
                  className="hover:text-primary transition-colors"
                >
                  For Rent
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/about"
                  className="hover:text-primary transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-primary transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-primary transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Contact</h4>
            <address className="not-italic text-sm text-muted-foreground space-y-2">
              <p>info@verifiedproperties.ng</p>
              <p>8a, Dar‑Es‑Salam, Wuse 2, Abuja</p>
            </address>
          </div>
        </div>
        <div className="border-t border-border mt-12 pt-8 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Verified Properties. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
