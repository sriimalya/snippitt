"use client";

import React from "react";
import { PieChart } from "lucide-react";

interface CategoryStat {
  category: string;
  _count: { _all: number };
}

interface CategoryChartProps {
  stats: CategoryStat[];
}

const CategoryChart = ({ stats }: CategoryChartProps) => {
  const totalPosts = stats.reduce((acc, curr) => acc + curr._count._all, 0);

  // Sort stats by count descending
  const sortedStats = [...stats].sort((a, b) => b._count._all - a._count._all);

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <PieChart size={18} className="text-[#5865F2]" />
        <h3 className="font-bold text-gray-900">Content Focus</h3>
      </div>

      <div className="space-y-5">
        {sortedStats.length > 0 ? (
          sortedStats.map((stat) => {
            const percentage = Math.round((stat._count._all / totalPosts) * 100);
            
            return (
              <div key={stat.category} className="group">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-bold text-gray-700 capitalize">
                    {stat.category.toLowerCase().replace(/_/g, " ")}
                  </span>
                  <span className="text-xs font-medium text-gray-400">
                    {stat._count._all} posts ({percentage}%)
                  </span>
                </div>
                {/* Progress Bar Container */}
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#5865F2] h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-gray-500 italic text-center py-4">
            No categories recorded yet.
          </p>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-50 flex justify-between items-center">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Contributions</span>
        <span className="text-sm font-black text-gray-900">{totalPosts}</span>
      </div>
    </div>
  );
};

export default CategoryChart;