import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

interface SpeedGraphProps {
  data: { time: string; speed: number }[];
  currentSpeed: string;
}

export const SpeedGraph: React.FC<SpeedGraphProps> = ({ data, currentSpeed }) => {
  return (
    <div className="w-full h-28 glass-panel rounded-2xl p-3 relative overflow-hidden flex flex-col justify-between">
      <div className="flex items-center justify-between z-10">
        <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          Tốc Độ Tải Thời Gian Thực
        </span>
        <span className="text-xs font-mono font-bold bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
          {currentSpeed || "0 MB/s"}
        </span>
      </div>

      <div className="w-full h-16 absolute inset-x-0 bottom-0 opacity-85 pointer-events-none">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="speedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="speed"
              stroke="#818cf8"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#speedGradient)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
