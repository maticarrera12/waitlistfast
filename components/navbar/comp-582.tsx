"use client";

import { motion, AnimatePresence, Variants } from "framer-motion";
import { Home12Icon, SaleTag01Icon, Login01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState, useEffect } from "react";


import UserMenu from "@/components/navbar/user-menu";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { useSessionQuery } from "@/hooks/useSessionQuery";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
// import Logo from "../ui/logo";

const navigationLinks = [
  { href: "/", label: "HOME", icon: Home12Icon, scrollTo: "top" },
  { href: "#pricing", label: "PRICING", icon: SaleTag01Icon, scrollTo: "pricing" },
  // { href: "/docs", label: "Docs", icon: BookOpen01Icon },
];

const sidebarVariants: Variants = {
  closed: {
    x: "-100%",
    opacity: 0,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 40,
    },
  },
  open: {
    x: "0%",
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30,
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  closed: { x: -20, opacity: 0 },
  open: {
    x: 0,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
};

export default function Navbar() {
  const { data: session, isLoading } = useSessionQuery();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);


  const handleNavigation = (
    e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
    link: (typeof navigationLinks)[0]
  ) => {
    setIsMobileMenuOpen(false);

    if (link.scrollTo) {
      e.preventDefault();
      if (link.scrollTo === "top") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const element = document.getElementById(link.scrollTo);
        if (element) {
          const headerOffset = 80;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          window.scrollTo({ top: offsetPosition, behavior: "smooth" });
        }
      }
      return;
    }

    if (link.href.startsWith("/")) {
      e.preventDefault();
      if (link.href === "/docs" || link.href.startsWith("/docs/")) {
        window.location.href = link.href;
      } else {
        router.push(link.href);
      }
    }
  };

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 transition-all duration-300 border-b border-primary",
          scrolled ? "bg-background/20 backdrop-blur-xl shadow-sm" : "bg-background/0"
        )}
      >
        <div className="mx-auto py-2 px-4 md:px-6 max-w-8xl">
          <div className="flex h-16 items-center md:max-w-[80%] mx-auto justify-between gap-4">
            <div className="flex flex-1 items-center gap-2">
              <Button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="group size-10 md:hidden hover:bg-muted/50 rounded-full"
                variant="ghost"
                size="icon"
                aria-expanded={isMobileMenuOpen}
              >
                <svg
                  className="pointer-events-none stroke-foreground"
                  width={24}
                  height={24}
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path
                    d="M6 12H18"
                    className="origin-center -translate-y-[6px] transition-all duration-300 
                      group-aria-expanded:translate-y-0 
                      group-aria-expanded:rotate-45"
                  />
                  <path
                    d="M4 12H20"
                    className="origin-center transition-all duration-300 
                      group-aria-expanded:opacity-0"
                  />
                  <path
                    d="M6 12H18"
                    className="origin-center translate-y-[6px] transition-all duration-300 
                      group-aria-expanded:translate-y-0 
                      group-aria-expanded:-rotate-45"
                  />
                </svg>
              </Button>

              <div className="flex items-center gap-6">
                <button
                  onClick={(e) =>
                    handleNavigation(e, {
                      href: "/",
                      label: "Home",
                      icon: Home12Icon,
                      scrollTo: "top",
                    })
                  }
                  className="text-primary hover:text-primary/90 cursor-pointer bg-transparent border-none p-0 transition-transform active:scale-95"
                >
                  {/* <Logo className="h-24 w-24" /> */}
                </button>

                <NavigationMenu className="hidden md:flex">
                  <NavigationMenuList className="gap-1">
                    {navigationLinks.map((link) => (
                      <NavigationMenuItem key={link.label}>
                        <a
                          href={link.href}
                          onClick={(e) => handleNavigation(e, link)}
                          className="px-4 py-2 text-sm font-bold text-foreground hover:text-muted-foreground transition-colors rounded-full hover:bg-muted/50"
                        >
                          {link.label}
                        </a>
                      </NavigationMenuItem>
                    ))}
                  </NavigationMenuList>
                </NavigationMenu>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:block">

              </div>

              {/* <button
                onClick={() => push("/waitlist")}
                className="glass-card group px-10 text-sm py-2 font-semibold tracking-wider transition-colors duration-300 hidden sm:flex items-center justify-center rounded-full"
                style={{ width: "auto", height: "auto" }}
              >
                <div className="absolute inset-0 rounded-full opacity-30 pointer-events-none">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background:
                        "radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.15) 0%, transparent 60%)",
                      filter: "blur(8px)",
                    }}
                  />
                </div>

                <span className="relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                  {"Waitlist".split("").map((letter: string, index: number) => (
                    <span
                      key={index}
                      className="inline-block animate-pulse-letter"
                      style={{
                        animationDelay: `${index * 0.12}s`,
                        animationDuration: "2.5s",
                      }}
                    >
                      {letter}
                    </span>
                  ))}
                </span>
              </button> */}

              {!isLoading &&
                (session?.user ? (
                  <UserMenu />
                ) : (
                  <Button onClick={() => router.push("/signin")} className="h-auto p-4 bg-primary text-primary-foreground hover:bg-primary/80 rounded-full">
                    <HugeiconsIcon icon={Login01Icon} strokeWidth={2} className="size-4" />
                    <span className="font-space-mono">Sign In</span>
                  </Button>
                ))}
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 top-16 z-40 bg-black/20 backdrop-blur-sm md:hidden"
            />

            <motion.aside
              variants={sidebarVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] w-[85%] max-w-[300px] border-r bg-background/95 backdrop-blur-xl shadow-2xl md:hidden"
            >
              <div className="flex h-full flex-col p-6">
                <nav className="flex flex-col gap-4">
                  {navigationLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <motion.a
                        key={link.label}
                        variants={itemVariants}
                        href={link.href}
                        onClick={(e) => handleNavigation(e, link)}
                        className="group flex items-center gap-4 rounded-xl px-4 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                      >
                        <div className="p-2 bg-muted/50 rounded-lg group-hover:bg-background group-hover:shadow-sm transition-all">
                          <HugeiconsIcon icon={Icon} strokeWidth={2} className="size-4" />
                        </div>
                        <span>{link.label}</span>
                      </motion.a>
                    );
                  })}
                </nav>

                {/* <button
                  className="glass-card group w-full px-8 py-3 text-sm font-semibold tracking-wider transition-colors duration-300 flex items-center justify-center rounded-full mt-4"
                  style={{ height: "auto" }}
                  onClick={() => {
                    push("/waitlist");
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <div className="absolute inset-0 rounded-full opacity-30 pointer-events-none">
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background:
                          "radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.15) 0%, transparent 60%)",
                        filter: "blur(8px)",
                      }}
                    />
                  </div>

                  <span className="relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                    {"Join Waitlist".split("").map((letter: string, index: number) => (
                      <span
                        key={index}
                        className="inline-block animate-pulse-letter"
                        style={{
                          animationDelay: `${index * 0.12}s`,
                          animationDuration: "2.5s",
                        }}
                      >
                        {letter === " " ? "\u00A0" : letter}
                      </span>
                    ))}
                  </span>
                </button> */}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
