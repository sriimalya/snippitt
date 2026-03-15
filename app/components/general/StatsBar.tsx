// app/components/posts/edit/StatsBar.tsx
"use client";

interface StatsBarProps {
  total: number;
  uploaded: number;
  images: number;
  videos: number;
}

export const StatsBar = ({ total, uploaded, images, videos }: StatsBarProps) => (
  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-4">
    <div className="grid grid-cols-4 divide-x divide-gray-100">
      {[
        { v: total,    label: "Files",    color: "text-gray-900" },
        { v: uploaded, label: "Uploaded", color: "text-green-600" },
        { v: images,   label: "Images",   color: "text-indigo-600" },
        { v: videos,   label: "Videos",   color: "text-purple-600" },
      ].map(({ v, label, color }) => (
        <div key={label} className="text-center px-4 first:pl-0 last:pr-0">
          <p className={`text-xl font-extrabold tabular-nums ${color}`}>{v}</p>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
            {label}
          </p>
        </div>
      ))}
    </div>
  </div>
);