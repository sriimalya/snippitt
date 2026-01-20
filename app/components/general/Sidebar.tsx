"use client";

import {
  Home,
  Compass,
  BookOpen,
  Bookmark,
  Plus,
} from "lucide-react";
import { ActiveTab } from "@/types";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Button from "@/app/components/Button";
import Logo from "@/assets/Snippit-logo-v2.svg";

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  userId: string | null;
}

const navItems: { label: string; tab: ActiveTab; icon: React.ReactNode }[] = [
  { label: "Home", tab: "home", icon: <Home className="w-5 h-5" /> },
  { label: "Explore", tab: "explore", icon: <Compass className="w-5 h-5" /> },
  { label: "Library", tab: "library", icon: <BookOpen className="w-5 h-5" /> },
  { label: "Saved", tab: "saved", icon: <Bookmark className="w-5 h-5" /> },
];

export const Sidebar = ({ activeTab, setActiveTab, userId }: SidebarProps) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Mobile Bottom Navigation (Instagram-style)
  if (isMobile) {
    return (
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-md"
        aria-label="Bottom navigation"
      >
        <ul className="flex items-center justify-around px-2 py-2">
          {navItems.map(({ label, tab, icon }) => {
            const isActive = activeTab === tab;

            return (
              <li key={tab} className="flex-1">
                <Link
                  href={
                    tab === "home"
                      ? "/dashboard"
                      : tab === "explore"
                      ? "/explore"
                      : tab === "library"
                      ? "/dashboard/my-collection"
                      : tab === "saved"
                      ? "/dashboard/saved"
                      : "#"
                  }
                  onClick={() => setActiveTab(tab)}
                  className={`flex flex-col items-center justify-center py-2 px-3 rounded-md transition-colors text-[13px] font-medium
                    ${
                      isActive
                        ? "text-[#5865F2]"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  aria-label={label}
                >
                  <div className={`${isActive ? "scale-110" : "scale-100"} transition-transform`}>
                    {icon}
                  </div>
                </Link>
              </li>
            );
          })}

          {/* Create button for mobile */}
          <li className="flex-1">
            <Link
              href="/dashboard/create-post"
              className="flex flex-col items-center justify-center py-2 px-3 rounded-md transition-colors text-gray-600 hover:text-gray-900"
              aria-label="Create Snippet"
            >
              <Plus className="w-7 h-7 p-1 bg-primary text-white rounded-full" />
            </Link>
          </li>
        </ul>
      </nav>
    );
  }

  // Desktop Sidebar
  return (
    <aside
      className="fixed top-0 left-0 z-40 h-screen w-64 bg-white shadow-lg flex flex-col"
      aria-label="Sidebar navigation"
    >
      {/* Header with Logo */}
      <div className="py-6 px-6">
        <Image src={Logo} alt="Company Logo" width={120} height={40} />
      </div>

      {/* Create Button */}
      <div className="px-4 mb-6">
        <Link href="/dashboard/create-post" className="w-full block">
          <Button type="button" variant="custom-blue" size="md" className="w-full text-[15px] font-semibold">
            + Create Snippet
          </Button>
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col flex-grow">
        <ul className="space-y-1 px-3">
          {navItems.map(({ label, tab, icon }) => {
            const isActive = activeTab === tab;

            return (
              <li key={tab}>
                <Link
                  href={
                    tab === "home"
                      ? "/dashboard"
                      : tab === "explore"
                      ? "/explore"
                      : tab === "library"
                      ? "/dashboard/my-collection"
                      : tab === "saved"
                      ? "/dashboard/saved"
                      : "#"
                  }
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-3 py-3 px-4 rounded-lg text-[15px] md:text-[16px] font-medium tracking-tight transition-all duration-200
                    ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-gray-800 hover:bg-primary/5 hover:text-primary"
                    }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className={`${isActive ? "scale-110" : "scale-100"} transition-transform`}>{icon}</span>
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};