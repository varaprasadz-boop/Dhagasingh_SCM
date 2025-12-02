import { Home, ScanLine, ShoppingCart, Package, User } from "lucide-react";
import { Link, useLocation } from "wouter";

interface NavItem {
  icon: typeof Home;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: Home, label: "Home", path: "/" },
  { icon: ScanLine, label: "Scan", path: "/scan" },
  { icon: ShoppingCart, label: "Orders", path: "/orders" },
  { icon: Package, label: "Stock", path: "/stock" },
  { icon: User, label: "Profile", path: "/profile" },
];

export function MobileBottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location === path || (path !== "/" && location.startsWith(path));
          return (
            <Link
              key={path}
              href={path}
              className={`flex flex-col items-center gap-1 p-2 min-w-[64px] ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
              data-testid={`nav-${label.toLowerCase()}`}
            >
              <div className="relative">
                <Icon className={`h-6 w-6 ${isActive ? "fill-primary/20" : ""}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </div>
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
