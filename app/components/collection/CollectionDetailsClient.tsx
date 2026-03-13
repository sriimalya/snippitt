"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Edit2,
  Ellipsis,
  Plus,
  Globe,
  Lock,
  Users,
  Calendar,
  ImageIcon,
} from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import Snippet from "@/app/components/general/Snippitt";
import Link from "next/link";
import DeleteCollectionButton from "./DeleteCollectionButton";
import ShareActionButton from "../general/ShareActionButton";
import Button from "../Button";

const VisibilityBadge = ({ visibility }: { visibility: string }) => {
  const map: Record<
    string,
    { icon: React.ReactNode; label: string; cls: string }
  > = {
    PUBLIC: {
      icon: <Globe size={10} />,
      label: "Public",
      cls: "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
    PRIVATE: {
      icon: <Lock size={10} />,
      label: "Private",
      cls: "bg-gray-100 text-gray-500 border-gray-200",
    },
    FOLLOWERS: {
      icon: <Users size={10} />,
      label: "Followers",
      cls: "bg-indigo-50 text-indigo-600 border-indigo-100",
    },
  };
  const v = map[visibility] ?? map.PRIVATE;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${v.cls}`}
    >
      {v.icon}
      {v.label}
    </span>
  );
};

const CollectionDetailsClient = ({
  collection,
  snippets,
  currentUserId,
  isOwner,
}: any) => {
  const [showActions, setShowAction] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const formattedDate = format(new Date(collection.createdAt), "MMM dd, yyyy");
  const actionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (actionRef.current && !actionRef.current.contains(e.target as Node))
        setShowAction(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Collection header card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Cover image or gradient banner */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
            <Link
              href={`/profile/${collection.user.id}`}
              className="flex items-center gap-3 group"
            >
              <div className="relative h-9 w-9 rounded-full overflow-hidden border border-gray-100 bg-gray-50 flex-shrink-0 group-hover:ring-2 group-hover:ring-indigo-500 group-hover:ring-offset-1 transition-all">
                {collection.user.avatar ? (
                  <Image
                    src={collection.user.avatar}
                    alt={collection.user.username}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="h-full w-full bg-indigo-50 flex items-center justify-center font-bold text-indigo-600 text-sm">
                    {collection.user.username[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
                  @{collection.user.username}
                </p>
                <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                  <Calendar size={9} />
                  {formattedDate || "—"}
                </p>
              </div>
            </Link>

            {/* Actions menu */}
            <div className="relative" ref={actionRef}>
              <button
                onClick={() => setShowAction((o) => !o)}
                className="w-8 h-8 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-all"
              >
                <Ellipsis size={16} className="text-gray-500" />
              </button>
              {showActions && (
                <div
                  className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20"
                  onClick={(e) => e.stopPropagation()}
                >
                  {isOwner && (
                    <>
                      <Link
                        href={`/collections/${collection.id}/edit`}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition"
                      >
                        <Edit2 size={14} className="mr-2" /> Edit
                      </Link>
                      <DeleteCollectionButton collectionId={collection.id} />
                    </>
                  )}
                  <ShareActionButton
                    id={collection.id}
                    title={collection.name}
                    url={`${process.env.NEXT_PUBLIC_APP_URL}/collections/${collection.id}`}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Info section */}
          <div className="px-5 py-4 space-y-3 border-b border-gray-100">
            <div className="flex items-center gap-2 flex-wrap">
              <VisibilityBadge visibility={collection.visibility} />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900 leading-snug">
              {collection.name}
            </h1>
            {collection.description && (
              <p className="text-sm text-gray-500 leading-relaxed">
                {collection.description}
              </p>
            )}
          </div>

          {/* Stats row */}
          <div className="px-5 sm:px-8 py-3.5 flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold text-gray-900 tabular-nums">
                {snippets.length}
              </span>
              <span className="text-xs font-medium text-gray-400">
                {snippets.length === 1 ? "snippet" : "snippets"}
              </span>
            </div>
          </div>
        </div>

        {/* Snippets grid */}
        {snippets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {snippets.map((post: any) => (
              <Snippet
                key={post.id}
                post={post}
                currentUserId={currentUserId}
                showActions={true}
                menuOpen={menuOpen}
                toggleMenu={setMenuOpen}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
            <ImageIcon className="w-10 h-10 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold">This collection is empty</h3>
            <p className="text-gray-600 mb-6">
              Start adding snippets to your collection to see them here.
            </p>
            <Link href={`/collections/${collection.id}/new`} >       
            <Button variant="primary" size="md">
              <Plus className="w-4 h-4 mr-1" /> Create Snippet
            </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectionDetailsClient;
