import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

interface NavbarProps {
  onOpenAuth: () => void;
}

export default function Navbar({ onOpenAuth }: NavbarProps) {
  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
              <ShieldCheck className="h-8 w-8" />
              <span className="font-bold text-xl tracking-wider">ECOGUARD</span>
            </Link>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <Link href="/" className="text-muted-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Home
              </Link>
              <Link href="#technology" className="text-muted-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Technology
              </Link>
              <Link href="#live-map" className="text-muted-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Live Map
              </Link>
              <Link href="#about" className="text-muted-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                About
              </Link>
            </div>
          </div>

          <div>
            <button
              onClick={onOpenAuth}
              className="bg-primary hover:bg-primary/90 text-primary-foreground border border-primary/50 px-4 py-2 rounded-md text-sm font-bold uppercase tracking-wide transition-all shadow-sm"
            >
              Access Dashboard
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
