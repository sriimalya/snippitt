"use client";

import {
  Home,
  Compass,
  BookOpen,
  Bookmark,
  Plus,
  FileText,
  PenLine,
  MoreHorizontal,
  Grid,
  X,
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

const Sidebar = ({ activeTab, setActiveTab, userId }: SidebarProps) => {
  const [isMobile, setIsMobile] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [showExploreSheet, setShowExploreSheet] = useState(false);
  const [showMoreSheet, setShowMoreSheet] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const navItems = [
    {
      label: "Home",
      tab: "home" as ActiveTab,
      icon: <Home size={22} />,
      href: "/dashboard",
    },
    {
      label: "Explore",
      tab: "explore" as ActiveTab,
      icon: <Compass size={22} />,
      href: "#",
    },
    {
      label: "Saved",
      tab: "saved" as ActiveTab,
      icon: <Bookmark size={22} />,
      href: "/saved",
    },
  ];

  const moreItems = [
    {
      label: "My Posts",
      tab: "my-posts" as ActiveTab,
      icon: <FileText size={20} />,
      href: "/my-posts",
    },
    {
      label: "Collections",
      tab: "my-collections" as ActiveTab,
      icon: <BookOpen size={20} />,
      href: "/my-collections",
    },
    {
      label: "Drafts",
      tab: "drafts" as ActiveTab,
      icon: <PenLine size={20} />,
      href: "/drafts",
    },
  ];

  const exploreLinks = [
    { label: "Users", href: "/explore/users" },
    { label: "Collections", href: "/explore/collections" },
    { label: "Posts", href: "/explore/posts" },
  ];

  // --- MOBILE VIEW ---
  if (isMobile) {
    return (
      <>
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-lg border-t border-gray-100 px-4 pb-safe shadow-[0_-1px_10px_rgba(0,0,0,0.05)]">
          <ul className="flex items-center justify-between h-16 max-w-md mx-auto">
            {/* Home & Explore */}
            {navItems.slice(0, 2).map((item) => (
              <MobileTab
                key={item.tab}
                {...item}
                isActive={activeTab === item.tab}
                onClick={() => {
                  if (item.tab === "explore") setShowExploreSheet(true);
                  else setActiveTab(item.tab);
                }}
              />
            ))}

            {/* Center FAB */}
            <li className="flex-1 flex justify-center -mt-8">
              <Link
                href="/create-post"
                className="w-14 h-14 bg-[#5865F2] text-white rounded-full shadow-lg shadow-indigo-200 flex items-center justify-center border-4 border-white active:scale-90 transition-transform"
              >
                <Plus size={28} strokeWidth={2} />
              </Link>
            </li>

            {/* Saved & More */}
            <MobileTab
              label="Saved"
              isActive={activeTab === "saved"}
              icon={<Bookmark size={22} />}
              href="/saved"
              onClick={() => setActiveTab("saved")}
            />
            <MobileTab
              label="More"
              isActive={showMoreSheet}
              icon={<MoreHorizontal size={22} />}
              href="#"
              onClick={() => setShowMoreSheet(true)}
            />
          </ul>
        </nav>

        {/* Explore Sheet */}
        <BottomSheet
          isOpen={showExploreSheet}
          onClose={() => setShowExploreSheet(false)}
          title="Explore"
        >
          <div className="grid grid-cols-1 gap-3">
            {exploreLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setShowExploreSheet(false)}
                className="p-4 bg-gray-50 rounded-xl font-medium text-center hover:bg-gray-100"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </BottomSheet>

        {/* More Sheet */}
        <BottomSheet
          isOpen={showMoreSheet}
          onClose={() => setShowMoreSheet(false)}
          title="Menu"
        >
          <div className="grid grid-cols-3 gap-4 pb-4">
            {moreItems.map((item) => (
              <Link
                key={item.tab}
                href={item.href}
                onClick={() => {
                  setShowMoreSheet(false);
                  setActiveTab(item.tab);
                }}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50"
              >
                <div className="p-3 bg-indigo-50 text-[#5865F2] rounded-full">
                  {item.icon}
                </div>
                <span className="text-xs font-medium text-gray-600">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </BottomSheet>
      </>
    );
  }

  // --- DESKTOP VIEW ---
  return (
    <aside className="fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-gray-100 flex flex-col overflow-hidden">
      <div className="py-8 px-8">
        <Image src={Logo} alt="Logo" width={110} height={36} priority />
      </div>

      <div className="px-4 mb-6">
        <Link href="/create-post" className="w-full block">
          <Button variant="primary" size="lg" className="w-full">
            <Plus size={18} strokeWidth={3} /> Create Post
          </Button>
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <div key={item.tab}>
            {item.tab === "explore" ? (
              <>
                <button
                  onClick={() => setExploreOpen(!exploreOpen)}
                  className={`w-full flex items-center justify-between py-3 px-4 rounded-xl transition-all ${activeTab === "explore" ? "bg-indigo-50 text-[#5865F2]" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon} <span className="font-medium">Explore</span>
                  </div>
                  <Plus
                    size={14}
                    className={`transition-transform ${exploreOpen ? "rotate-45" : ""}`}
                  />
                </button>
                {exploreOpen && (
                  <div className="ml-11 mt-1 space-y-1">
                    {exploreLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="block py-2 text-sm text-gray-500 hover:text-[#5865F2]"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <DesktopNavLink
                {...item}
                isActive={activeTab === item.tab}
                onClick={() => setActiveTab(item.tab)}
              />
            )}
          </div>
        ))}

        <div className="pt-4 pb-2 px-4">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Management
          </p>
        </div>

        {moreItems.map((item) => (
          <DesktopNavLink
            key={item.tab}
            {...item}
            isActive={activeTab === item.tab}
            onClick={() => setActiveTab(item.tab)}
          />
        ))}
      </nav>
    </aside>
  );
};

// --- HELPER COMPONENTS ---

const MobileTab = ({ label, icon, isActive, onClick, href }: any) => (
  <li className="flex-1">
    <Link
      href={href}
      onClick={(e) => {
        if (href === "#") e.preventDefault();
        onClick();
      }}
      className={`flex flex-col items-center justify-center gap-1 h-full transition-colors ${isActive ? "text-[#5865F2]" : "text-gray-400"}`}
    >
      <div
        className={`${isActive ? "scale-110" : "scale-100"} transition-transform`}
      >
        {icon}
      </div>
    </Link>
  </li>
);

const DesktopNavLink = ({ label, icon, isActive, onClick, href }: any) => (
  <Link
    href={href}
    onClick={onClick}
    className={`flex items-center gap-3 py-3 px-4 rounded-xl transition-all font-medium ${isActive ? "bg-indigo-50 text-[#5865F2]" : "text-gray-600 hover:bg-gray-50"}`}
  >
    {icon} <span>{label}</span>
  </Link>
);

const BottomSheet = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div
        className="absolute inset-0 bg-black/40 animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="relative bg-white w-full rounded-t-[32px] p-6 pt-2 shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto my-3" />
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export { Sidebar };
