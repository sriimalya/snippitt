"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Folder,
  FileText,
  PenLine,
  Users,
  Heart,
  Plus,
  ChevronRight,
} from "lucide-react";
import Button from "@/app/components/Button";
import Snippet from "./Snippitt";

const DashboardClient = ({ data, currentUserId, currentUserName }: any) => {
  const { stats, recentPosts, drafts, collections } = data;
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const toggleMenu = (id: string) => setMenuOpen(menuOpen === id ? null : id);
  const firstName = currentUserName?.split(" ")[0] || "there";

  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    if (hour < 21) return "Good evening";
    return "Good night";
  };

  const greeting = getGreeting();

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      {/* ── HEADER BAR ── */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-1">
            Welcome back!
          </p>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 break-words">
            {greeting}, {firstName} 👋
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Here's everything happening with your content.
          </p>
        </div>

        <Link href="/create-post" className="w-full sm:w-auto">
          <Button
            variant="primary"
            size="md"
            className="flex items-center justify-center gap-1 w-full sm:w-auto"
          >
            <Plus size={16} />
            New Post
          </Button>
        </Link>
      </header>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Posts"
          value={stats.postsCount}
          icon={<FileText size={18} />}
          color="indigo"
        />
        <StatCard
          label="Followers"
          value={stats.followers}
          icon={<Users size={18} />}
          color="violet"
        />
        <StatCard
          label="Following"
          value={stats.followings}
          icon={<Heart size={18} />}
          color="rose"
        />
        <StatCard
          label="Drafts"
          value={drafts.length}
          icon={<PenLine size={18} />}
          color="amber"
        />
      </div>

      {/* ── MAIN CONTENT SPLIT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT: Recent Posts (2/3 width) */}
        <div className="lg:col-span-2 space-y-5">
          <SectionHeader
            title="Recent Posts"
            icon={<FileText size={15} />}
            href="/my-posts"
            count={recentPosts.length}
          />

          <div className="space-y-3">
            {recentPosts.length > 0 ? (
              recentPosts.map((post: any) => (
                <PostRow
                  key={post.id}
                  post={post}
                  currentUserId={currentUserId}
                  menuOpen={menuOpen}
                  toggleMenu={toggleMenu}
                />
              ))
            ) : (
              <EmptyState
                icon={<FileText size={28} />}
                text="No posts yet"
                sub="Create your first snippet to get started."
                action={{ label: "Create Snippet", href: "/create-post" }}
              />
            )}
          </div>
        </div>

        {/* RIGHT: Sidebar (1/3 width) */}
        <div className="space-y-6">
          {/* Drafts panel */}
          <SectionHeader
            title="Drafts"
            icon={<PenLine size={15} />}
            href="/drafts"
            count={drafts.length}
          />

          <div className="space-y-2">
            {drafts.length > 0 ? (
              drafts
                .slice(0, 4)
                .map((post: any) => <DraftRow key={post.id} post={post} />)
            ) : (
              <EmptyState
                icon={<PenLine size={24} />}
                text="No drafts"
                sub="Works in progress will appear here."
                action={null}
              />
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200" />

          {/* Collections panel */}
          <SectionHeader
            title="Collections"
            icon={<Folder size={15} />}
            href="/my-collections"
            count={collections.length}
          />

          <div className="space-y-2">
            {collections.length > 0 ? (
              collections
                .slice(0, 5)
                .map((col: any) => <CollectionRow key={col.id} col={col} />)
            ) : (
              <EmptyState
                icon={<Folder size={24} />}
                text="No collections"
                sub="Organise your snippets into collections."
                action={null}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardClient;

const colorMap: Record<string, { bg: string; icon: string; badge: string }> = {
  indigo: {
    bg: "bg-indigo-50",
    icon: "text-indigo-600",
    badge: "bg-indigo-100 text-indigo-600",
  },
  violet: {
    bg: "bg-violet-50",
    icon: "text-violet-600",
    badge: "bg-violet-100 text-violet-600",
  },
  rose: {
    bg: "bg-rose-50",
    icon: "text-rose-500",
    badge: "bg-rose-100 text-rose-500",
  },
  amber: {
    bg: "bg-amber-50",
    icon: "text-amber-500",
    badge: "bg-amber-100 text-amber-600",
  },
};

function StatCard({ label, value, icon, color }: any) {
  const c = colorMap[color];
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        {/* LATER */}
        {/* {trend && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${c.badge}`}>
          {trend}
          </span>
          )} */}
        <div>
          <p className="text-3xl font-black text-gray-900 tabular-nums">
            {value}
          </p>
          <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
        </div>
        <div className={`p-2.5 rounded-xl ${c.bg} ${c.icon}`}>{icon}</div>
      </div>
    </div>
  );
}

function SectionHeader({ title, icon, href, count }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-gray-400">{icon}</span>
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
          {title}
        </h2>
        {typeof count === "number" && (
          <span className="text-xs bg-gray-100 text-gray-500 font-semibold px-2 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 transition-colors"
        >
          View all <ChevronRight size={12} />
        </Link>
      )}
    </div>
  );
}

function PostRow({ post, menuOpen, toggleMenu, currentUserId }: any) {
  return (
    <Snippet
      post={post}
      menuOpen={menuOpen}
      toggleMenu={toggleMenu}
      currentUserId={currentUserId}
      showActions={true}
      variant="compact"
    />
  );
}

function DraftRow({ post }: any) {
  return (
    <Link href={`/drafts/${post.id}`}>
      <div className="group flex items-center gap-3 p-3 rounded-xl hover:bg-white border border-transparent hover:border-gray-100 hover:shadow-sm transition-all cursor-pointer">
        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0">
          <PenLine size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-700 truncate group-hover:text-gray-900">
            {post.title || "Untitled Draft"}
          </p>
          <p className="text-[11px] text-gray-400">
            {post.updatedAt
              ? `Edited ${new Date(post.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
              : "Draft"}
          </p>
        </div>
        <ChevronRight
          size={14}
          className="text-gray-300 group-hover:text-gray-400 transition"
        />
      </div>
    </Link>
  );
}

function CollectionRow({ col }: any) {
  return (
    <Link href={`/my-collections/${col.id}`}>
      <div className="group flex items-center gap-3 p-3 rounded-xl hover:bg-white border border-transparent hover:border-gray-100 hover:shadow-sm transition-all cursor-pointer">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center flex-shrink-0">
          <Folder size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-700 truncate group-hover:text-gray-900">
            {col.name}
          </p>
          <p className="text-[11px] text-gray-400">
            {col._count.snippets} items
          </p>
        </div>
        <ChevronRight
          size={14}
          className="text-gray-300 group-hover:text-gray-400 transition"
        />
      </div>
    </Link>
  );
}

function EmptyState({ icon, text, sub, action }: any) {
  return (
    <div className="flex flex-col items-center justify-center py-12 rounded-2xl border border-dashed border-gray-200 bg-white/60 text-center px-6">
      <span className="text-gray-300 mb-3">{icon}</span>
      <p className="text-sm font-semibold text-gray-500">{text}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      {action && (
        <Link href={action.href}>
          <button className="mt-4 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-colors">
            {action.label}
          </button>
        </Link>
      )}
    </div>
  );
}
