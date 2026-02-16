"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Folder,
  FileText,
  ArrowRight,
  PenLine,
  LayoutDashboard,
} from "lucide-react";
import Snippitt from "@/app/components/general/Snippitt";
import Button from "@/app/components/Button";

const DashboardClient = ({ data, currentUserId, currentUserName }: any) => {
  const { stats, recentPosts, drafts, collections } = data;
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const toggleMenu = (id: string) => setMenuOpen(menuOpen === id ? null : id);

  return (
    <div className="space-y-12 pb-24">
      {/* ================= HERO ================= */}
      <div className="relative overflow-hidden rounded-3xl border border-white/40 bg-gradient-to-br from-[#5865F2]/15 via-white to-[#94BBFF]/15 p-6 sm:p-8 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* LEFT */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-3">
              <LayoutDashboard className="text-[#5865F2]" size={26} />
              Welcome back,{" "}
              <span>
                {currentUserName?.split(" ")[0] || "there"}
              </span>
              👋
            </h1>

            <p className="text-gray-500 mt-1 text-sm">
              Manage your snippets, drafts and collections
            </p>
          </div>

          {/* RIGHT BUTTON */}
          <div className="w-full md:w-auto">
            <Link href="/create-post" className="block md:inline-block">
              <Button
                type="button"
                variant="primary"
                size="lg"
                className="w-full md:w-auto px-6"
              >
                + Create Post
              </Button>
            </Link>
          </div>
        </div>

        {/* subtle glow */}
        <div className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 bg-[#5865F2]/20 blur-3xl rounded-full" />
      </div>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        <StatCard label="Followers" value={stats.followers} />
        <StatCard label="Following" value={stats.followings} />
        <StatCard label="Posts" value={stats.postsCount} />
      </div>

      {/* ================= RECENT POSTS ================= */}
      <SectionHeader
        title="Recent Posts"
        icon={<FileText size={18} />}
        href="/my-posts"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {recentPosts.length > 0 ? (
          recentPosts.map((post: any) => (
            <Snippitt
              key={post.id}
              post={{
                ...post,
                coverImage: post.coverImage || "/default-cover.png",
              }}
              currentUserId={currentUserId}
              menuOpen={menuOpen}
              toggleMenu={toggleMenu}
            />
          ))
        ) : (
          <EmptyState text="No posts yet. Create your first snippet." />
        )}
      </div>

      {/* ================= DRAFTS ================= */}
      <SectionHeader
        title="Drafts"
        icon={<PenLine size={18} />}
        href="/drafts"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {drafts.length > 0 ? (
          drafts.map((post: any) => (
            <Snippitt
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              menuOpen={menuOpen}
              toggleMenu={toggleMenu}
            />
          ))
        ) : (
          <EmptyState text="No drafts yet." />
        )}
      </div>

      {/* ================= COLLECTIONS ================= */}
      <SectionHeader
        title="Collections"
        icon={<Folder size={18} />}
        href="/my-collections"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {collections.length > 0 ? (
          collections.map((col: any) => (
            <Link
              key={col.id}
              href={`/my-collections/${col.id}`}
              className="group rounded-3xl border border-gray-100 bg-white/80 backdrop-blur p-6 shadow-sm hover:shadow-xl transition"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-[#5865F2]/10 rounded-xl">
                  <Folder size={22} className="text-[#5865F2]" />
                </div>

                <ArrowRight
                  size={16}
                  className="opacity-0 group-hover:opacity-100 transition"
                />
              </div>

              <h4 className="font-bold text-lg text-gray-900 group-hover:text-[#5865F2]">
                {col.name}
              </h4>

              <p className="text-xs text-gray-400 mt-1">
                {col._count.snippets} items
              </p>
            </Link>
          ))
        ) : (
          <EmptyState text="No collections yet." />
        )}
      </div>
    </div>
  );
};

export default DashboardClient;

function StatCard({ label, value }: any) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white/80 backdrop-blur p-6 shadow-sm hover:shadow-lg transition">
      <p className="text-xs uppercase font-bold text-gray-400">{label}</p>
      <h3 className="text-3xl font-black text-gray-900 mt-1">{value}</h3>
    </div>
  );
}

function SectionHeader({ title, icon, href }: any) {
  return (
    <div className="flex items-center justify-between px-1">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[#5865F2]/10 text-[#5865F2] rounded-xl">
          {icon}
        </div>
        <h2 className="text-2xl font-black text-gray-900">{title}</h2>
      </div>

      {href && (
        <Link
          href={href}
          className="text-sm font-semibold text-[#5865F2] flex items-center gap-1 hover:gap-2 transition"
        >
          View all <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}

function EmptyState({ text }: any) {
  return (
    <div className="col-span-full py-20 rounded-3xl border border-dashed border-gray-200 bg-white/60 backdrop-blur text-center text-gray-400">
      {text}
    </div>
  );
}
