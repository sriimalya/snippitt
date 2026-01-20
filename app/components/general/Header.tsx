"use client";

import Link from "next/link";
import { Bell, User } from "lucide-react";

interface HeaderProps {
  userId: string | null;
}

export const Header = ({ userId }: HeaderProps) => {
  return (
    <header
      className="sticky top-0 py-2 px-4 sm:px-6 md:px-6 flex justify-end items-center transition-all duration-300 bg-white border-b border-gray-200 z-30"
    >
      <div className="flex items-center space-x-3">
        {/* Notification Icon */}
        <Link
          href="/notifications"
          className="relative p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5865F2]"
          aria-label="Notifications"
        >
          <Bell className="w-6 h-6 text-gray-700" />
          {/* Notification badge (optional - uncomment if you want to show unread count) */}
          {/* <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span> */}
        </Link>

        {/* Profile Icon */}
        <Link
           href={`/profile/${userId}`}
          className="flex items-center gap-3 p-2 rounded-full text-md font-medium transition-colors
            text-gray-900 hover:bg-[#5865F2]/6
            focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5865F2]"
          aria-label="Profile"
        >
          <User className="w-6 h-6 text-gray-700" />
        </Link>
      </div>
    </header>
  );
};