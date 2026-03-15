"use client";

import {
  Globe,
  Users,
  Lock,
  FileText,
  ChevronRight,
  Edit2,
  Loader2,
  Eye as EyeIcon,
} from "lucide-react";
import { Visibility } from "@/app/generated/prisma/enums";

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
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${v.cls}`}
    >
      {v.icon}
      {v.label}
    </span>
  );
};

const VISIBILITY_OPTIONS = [
  {
    vis: "PUBLIC" as Visibility,
    label: "Public",
    icon: Globe,
    desc: "Anyone can see this",
    iconColor: "text-green-600",
    iconBg: "bg-green-50",
    activeIconBg: "bg-green-100",
    activeBorder: "border-green-400",
    activeBg: "bg-green-50",
    inactiveBorder: "border-green-200 hover:border-green-400",
    inactiveBg: "hover:bg-green-50",
    labelColor: "text-green-700",
    dotColor: "bg-green-500",
  },
  {
    vis: "FOLLOWERS" as Visibility,
    label: "Followers Only",
    icon: Users,
    desc: "Only your followers",
    iconColor: "text-indigo-600",
    iconBg: "bg-indigo-50",
    activeIconBg: "bg-indigo-100",
    activeBorder: "border-indigo-400",
    activeBg: "bg-indigo-50",
    inactiveBorder: "border-indigo-200 hover:border-indigo-400",
    inactiveBg: "hover:bg-indigo-50",
    labelColor: "text-indigo-700",
    dotColor: "bg-indigo-500",
  },
  {
    vis: "PRIVATE" as Visibility,
    label: "Private",
    icon: Lock,
    desc: "Only you can see this",
    iconColor: "text-gray-500",
    iconBg: "bg-gray-100",
    activeIconBg: "bg-gray-200",
    activeBorder: "border-gray-400",
    activeBg: "bg-gray-100",
    inactiveBorder: "border-gray-200 hover:border-gray-400",
    inactiveBg: "hover:bg-gray-50",
    labelColor: "text-gray-700",
    dotColor: "bg-gray-500",
  },
];

interface VisibilityPanelProps {
  visibility: Visibility;
  isDraft?: boolean;
  isSubmitting: boolean;
  currVisibility: string;
  postIsDraft?: boolean;
  onChange: (visibility: Visibility, isDraft: boolean) => void;
}

export const VisibilityPanel = ({
  visibility,
  isDraft,
  isSubmitting,
  currVisibility,
  postIsDraft,
  onChange,
}: VisibilityPanelProps) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <EyeIcon size={13} className="text-gray-400" />
          <span className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">
            Visibility
          </span>
        </div>
        <div className="flex items-center gap-2">
          <VisibilityBadge visibility={currVisibility} />
          {postIsDraft && (
            <span className="bg-amber-50 text-amber-600 border-amber-100 inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider">
              <Edit2 size={10} /> Draft
            </span>
          )}
        </div>
      </div>

      <div className="p-3 space-y-2">
        {VISIBILITY_OPTIONS.map(
          ({
            vis,
            label,
            icon: Icon,
            desc,
            iconColor,
            iconBg,
            activeIconBg,
            activeBorder,
            activeBg,
            inactiveBorder,
            inactiveBg,
            labelColor,
            dotColor,
          }) => {
            const isActive = visibility === vis && !isDraft;
            return (
              <button
                key={vis}
                onClick={() => onChange(vis, false)}
                disabled={isSubmitting}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border text-left group active:scale-[0.98] transition-all disabled:opacity-50 shadow-sm
                ${isActive ? `${activeBorder} ${activeBg}` : `${inactiveBorder} ${inactiveBg} bg-white`}`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? activeIconBg : iconBg}`}
                >
                  <Icon size={13} className={iconColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-semibold ${labelColor} leading-none mb-0.5`}
                  >
                    {label}
                  </p>
                  <p className="text-[11px] text-gray-400">{desc}</p>
                </div>
                {isActive ? (
                  <div
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`}
                  />
                ) : (
                  <ChevronRight
                    size={13}
                    className="text-gray-300 group-hover:text-gray-500 flex-shrink-0 transition-colors"
                  />
                )}
              </button>
            );
          },
        )}

        {postIsDraft && (
          <>
            {/* Divider */}
            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center px-1">
                <div className="w-full border-t border-dashed border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-2 text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                  or
                </span>
              </div>
            </div>

            {/* Draft */}
            <button
              onClick={() => onChange(visibility, true)}
              disabled={isSubmitting}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border text-left group active:scale-[0.98] transition-all disabled:opacity-50 shadow-sm
            ${isDraft ? "border-amber-400 bg-amber-50" : "border-amber-200 hover:border-amber-400 bg-white hover:bg-amber-50"}`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isDraft ? "bg-amber-100" : "bg-amber-50"}`}
              >
                <FileText size={13} className="text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-700 leading-none mb-0.5">
                  Save as Draft
                </p>
                <p className="text-[11px] text-gray-400">
                  Hidden until published
                </p>
              </div>
              {isDraft ? (
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
              ) : (
                <ChevronRight
                  size={13}
                  className="text-gray-300 group-hover:text-amber-400 flex-shrink-0 transition-colors"
                />
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
