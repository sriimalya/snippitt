"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Header } from "@/app/components/general/Header";
import { Sidebar } from "@/app/components/general/Sidebar";
import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';
import { ActiveTab } from "@/types";

export default function ClientShell({ 
  children, 
  userId 
}: { 
  children: React.ReactNode; 
  userId: string | null 
}) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("home");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // useMemo prevents the Sidebar/Header from re-rendering 
  // unless the userId or mobile status actually changes.
  const memoizedSidebar = useMemo(() => (
    <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userId={userId} />
  ), [activeTab, userId]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <ProgressBar height="3px" color="#5865F2" options={{ showSpinner: false }} shallowRouting />
      
      <Header userId={userId} />
      
      <div className="flex flex-row flex-grow overflow-hidden">
        {memoizedSidebar}
        <div className="flex-grow overflow-auto hide-scrollbar">
          <main className={`${isMobile ? "mb-20" : "ml-64"} min-h-screen mx-auto px-4 md:px-6 mt-6`}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}