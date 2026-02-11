"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, Folder, FileText, ArrowRight } from "lucide-react";
import Snippitt from "@/app/components/general/Snippitt";
import Image from "next/image";

const DashboardClient = ({ data, currentUserId }: any) => {
  const { stats, recentPosts, drafts, collections } = data;
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const toggleMenu = (id: string) => setMenuOpen(menuOpen === id ? null : id);
  return (
    <div className="space-y-12 pb-20">
      {/* 1. Stats Overview & User Profile */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* User Profile Card */}
        <div className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-primary/20 overflow-hidden rounded-2xl flex-shrink-0">
            {stats.avatar ? (
              <Image
                src={stats.avatar} // This is the signed S3 URL from your server action
                alt="My Profile"
                className="w-full h-full object-cover"
                width={56}
                height={56}
                unoptimized={true}
              />
            ) : (
              <span className="w-full h-full flex items-center justify-center text-xl font-black text-[#5865F2]">
                {/* You can pass the username through 'data' to get the initial */}
                U
              </span>
            )}
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Creator
            </p>
            <h3 className="text-lg font-black text-gray-900 truncate">
              Dashboard
            </h3>
          </div>
        </div>

        {/* Follower Stats */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm text-center md:text-left">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
            Followers
          </p>
          <h3 className="text-3xl font-black text-gray-900">
            {stats.followers}
          </h3>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm text-center md:text-left">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
            Following
          </p>
          <h3 className="text-3xl font-black text-gray-900">
            {stats.followings}
          </h3>
        </div>

        {/* Action Button */}
        <Link
          href="/dashboard/create-post"
          className="bg-[#5865F2] p-6 rounded-[2rem] shadow-lg shadow-[#5865F2]/20 flex items-center justify-between group hover:scale-[1.02] transition-all"
        >
          <div className="bg-white/20 p-3 rounded-2xl text-white">
            <Plus size={24} />
          </div>
          <h3 className="text-sm font-black text-white uppercase tracking-tighter">
            New Snippet
          </h3>
        </Link>
      </div>

      {/* 2. Recent Posts */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 text-green-600 rounded-xl">
              <FileText size={20} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              Recent Posts
            </h2>
          </div>
          <Link
            href="/dashboard/posts"
            className="text-sm font-bold text-[#5865F2] hover:underline flex items-center gap-1"
          >
            View All <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {recentPosts.length > 0 ? (
            recentPosts.map((post: any) => (
              <Snippitt
                key={post.id}
                post={post}
                currentUserId={currentUserId}
                menuOpen={menuOpen}
                toggleMenu={toggleMenu}
              />
            ))
          ) : (
            <div className="col-span-3 py-12 border-2 border-dashed border-gray-100 rounded-[2rem] text-center text-gray-400 font-medium">
              You haven&apos;t published anything yet.
            </div>
          )}
        </div>
      </section>

      {/* 3. Drafts Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Plus size={20} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              Drafts
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 opacity-80">
          {drafts.length > 0 ? (
            drafts.map((post: any) => (
              <div key={post.id} className="relative">
                <div className="absolute top-4 right-4 z-10 bg-amber-500 text-white text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-tighter shadow-sm">
                  Draft
                </div>
                <Snippitt
                  post={post}
                  currentUserId={currentUserId}
                  menuOpen={menuOpen}
                  toggleMenu={toggleMenu}
                />
              </div>
            ))
          ) : (
            <div className="col-span-3 py-12 bg-gray-50/50 border-2 border-dashed border-gray-100 rounded-[2rem] text-center text-gray-400 font-medium">
              Your drafting table is empty.
            </div>
          )}
        </div>
      </section>

      {/* 4. Collections Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Folder size={20} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              Latest Collections
            </h2>
          </div>
          <Link
            href="/dashboard/collections"
            className="text-sm font-bold text-purple-600 hover:underline flex items-center gap-1"
          >
            Browse All <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {collections.map((col: any) => (
            <Link
              key={col.id}
              href={`/dashboard/collections/${col.id}`}
              className="group bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:border-purple-200 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl group-hover:scale-110 transition-transform">
                  <Folder size={24} />
                </div>
                <span className="text-[10px] font-black text-gray-300 uppercase">
                  {col._count.snippets} items
                </span>
              </div>
              <h4 className="text-lg font-black text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">
                {col.name}
              </h4>
              <p className="text-xs text-gray-400 font-medium line-clamp-1">
                {col.description || "No description provided."}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default DashboardClient;
