"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit3, Globe, Lock, Users, Calendar } from "lucide-react";
import Image from "next/image";
import Snippet from "@/app/components/general/Snippitt";
import Link from "next/link";

const CollectionViewClient = ({ collection, snippets, currentUserId, isOwner }: any) => {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const toggleMenu = (id: string) => setMenuOpen(menuOpen === id ? null : id);

  const visibilityIcons: any = {
    PUBLIC: <Globe size={14} />,
    FOLLOWERS: <Users size={14} />,
    PRIVATE: <Lock size={14} />,
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 1. Immersive Hero Header */}
      <div className="relative h-[40vh] w-full bg-gray-900 overflow-hidden">
        {collection.coverImage ? (
          <Image 
            src={collection.coverImage} 
            alt={collection.name} 
            fill 
            className="object-cover opacity-60"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#5865F2] to-[#4752C4] opacity-80" />
        )}
        
        {/* Overlay Content */}
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-gray-50 to-transparent">
          <div className="max-w-5xl mx-auto w-full px-6 pb-12">
            <button 
              onClick={() => router.back()}
              className="mb-6 flex items-center gap-2 text-white/80 hover:text-white transition group w-fit"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 
              <span className="font-bold text-sm tracking-tight">Back</span>
            </button>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white rounded-full text-[10px] font-black tracking-widest flex items-center gap-1.5 uppercase">
                    {visibilityIcons[collection.visibility]}
                    {collection.visibility}
                  </span>
                  <span className="text-white/60 text-xs font-bold flex items-center gap-1.5">
                    <Calendar size={14} /> 
                    {new Date(collection.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter leading-[0.9]">
                  {collection.name}
                </h1>
                
                {collection.description && (
                  <p className="text-gray-600 text-lg max-w-2xl font-medium leading-relaxed">
                    {collection.description}
                  </p>
                )}
              </div>

              {isOwner && (
                <Link 
                  href={`/dashboard/collections/${collection.id}/edit`}
                  className="flex items-center gap-2 px-8 py-4 bg-[#5865F2] text-white rounded-2xl font-black text-sm shadow-xl shadow-[#5865F2]/30 hover:scale-105 transition active:scale-95"
                >
                  <Edit3 size={18} /> Edit Collection
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Snippets Grid */}
      <div className="max-w-5xl mx-auto px-6 -mt-6 relative z-10">
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-10">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Snippets</h2>
              <p className="text-sm text-gray-400 font-bold">{snippets.length} items shared in this collection</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {snippets.map((post: any) => (
              <Snippet 
                key={post.id}
                post={post}
                currentUserId={currentUserId}
                showActions={true}
                menuOpen={menuOpen}
                toggleMenu={toggleMenu}
              />
            ))}

            {snippets.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-300 border-2 border-dashed border-gray-100 rounded-[2rem]">
                <p className="font-black text-xl">This collection is empty</p>
                <p className="text-sm font-bold">Check back later for new snippets!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionViewClient;