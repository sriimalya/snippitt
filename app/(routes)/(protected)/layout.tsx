"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ActiveTab } from "@/types";
import { Header } from "@/app/components/general/Header";
import { Sidebar } from "@/app/components/general/Sidebar";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<ActiveTab>("home");
  const [isMobile, setIsMobile] = useState(false);

  const userId = session?.user?.id || null;

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header userId={userId} />
      <div className="flex flex-row flex-grow overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userId={userId} />
        <div className="flex-grow overflow-auto hide-scrollbar">
          <div 
            className={`${
              isMobile ? "mb-20" : "ml-64"
            } min-h-screen mx-auto px-4 md:px-6 mt-6`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;