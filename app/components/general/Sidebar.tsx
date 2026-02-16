"use client";

import { Home, Compass, BookOpen, Bookmark, Plus } from "lucide-react";
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

const exploreItems = [
  { label: "Users", href: "/explore/users" },
  { label: "Collections", href: "/explore/collections" },
  { label: "Posts", href: "/explore/posts" },
];

export const Sidebar = ({ activeTab, setActiveTab, userId }: SidebarProps) => {
  const [isMobile, setIsMobile] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [showExploreSheet, setShowExploreSheet] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Mobile Bottom Navigation
  if (isMobile) {
    return (
      <>
        {/* Bottom Nav */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-md"
          aria-label="Bottom navigation"
        >
          <ul className="flex items-center justify-around px-2 py-2">
            {navItems.map(({ label, tab, icon }) => {
              const isActive = activeTab === tab;

              const href =
                tab === "home"
                  ? "/dashboard"
                  : tab === "library"
                    ? "/my-collections"
                    : tab === "saved"
                      ? "/saved"
                      : "#";

              return (
                <li key={tab} className="flex-1">
                  <Link
                    href={href}
                    onClick={(e) => {
                      if (tab === "explore") {
                        e.preventDefault();
                        setShowExploreSheet(true);
                        return;
                      }
                      setActiveTab(tab);
                    }}
                    className={`flex flex-col items-center justify-center py-2 px-3 rounded-md transition-colors text-[13px] font-medium
                    ${
                      isActive
                        ? "text-[#5865F2]"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                    aria-label={label}
                  >
                    <div
                      className={`${
                        isActive ? "scale-110" : "scale-100"
                      } transition-transform`}
                    >
                      {icon}
                    </div>
                  </Link>
                </li>
              );
            })}

            {/* Create button */}
            <li className="flex-1">
              <Link
                href="/create-post"
                className="flex flex-col items-center justify-center py-2 px-3 rounded-md transition-colors text-gray-600 hover:text-gray-900"
                aria-label="Create Post"
              >
                <Plus className="w-7 h-7 p-1 bg-primary text-white rounded-full" />
              </Link>
            </li>
          </ul>
        </nav>

        {/* Explore Bottom Sheet */}
        {showExploreSheet && (
          <div
            className="fixed inset-0 z-50 bg-black/40 flex items-end"
            onClick={() => setShowExploreSheet(false)}
          >
            {/* Sheet */}
            <div
              className="bg-white w-full rounded-t-2xl p-6 animate-[slideUp_.25s_ease]"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4 text-center">
                Explore
              </h3>

              <div className="space-y-3">
                {exploreItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      setShowExploreSheet(false);
                      setActiveTab("explore");
                    }}
                    className="block py-3 text-center rounded-xl bg-gray-100 hover:bg-gray-200 text-[15px] font-medium"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              <button
                onClick={() => setShowExploreSheet(false)}
                className="mt-5 w-full py-3 text-gray-500 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </>
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
        <Link href="/create-post" className="w-full block">
          <Button
            type="button"
            variant="primary"
            size="lg"
            className="w-full text-[15px]"
          >
            + Create Post
          </Button>
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col flex-grow">
        <ul className="space-y-1 px-3">
          {navItems.map(({ label, tab, icon }) => {
            const isActive = activeTab === tab;

            if (tab === "explore") {
              return (
                <li key={tab}>
                  {/* Parent button */}
                  <button
                    onClick={() => setExploreOpen(!exploreOpen)}
                    className={`w-full flex items-center gap-3 py-3 px-4 rounded-lg text-[15px] font-medium
      ${isActive ? "bg-primary/10 text-primary" : "text-gray-800 hover:bg-primary/5"}`}
                  >
                    {icon}
                    <span>Explore</span>
                  </button>

                  {/* Dropdown */}
                  {exploreOpen && (
                    <ul className="ml-8 mt-1 space-y-1">
                      {exploreItems.map((item) => (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={() => setActiveTab("explore")}
                            className="block py-2 px-4 text-sm text-gray-600 hover:text-primary hover:bg-primary/5 rounded-lg"
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            }

            // normal items
            return (
              <li key={tab}>
                <Link
                  href={
                    tab === "home"
                      ? "/dashboard"
                      : tab === "library"
                        ? "/my-collections"
                        : tab === "saved"
                          ? "/saved"
                          : "#"
                  }
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-3 py-3 px-4 rounded-lg text-[15px] font-medium
          ${isActive ? "bg-primary/10 text-primary" : "text-gray-800 hover:bg-primary/5"}`}
                >
                  {icon}
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
