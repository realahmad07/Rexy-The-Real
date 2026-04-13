import React, { useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';

interface TerminalProps {
  logs: string[];
  anomalyData: { name: string; value: number }[];
  isAuditing: boolean;
}

export const Terminal: React.FC<TerminalProps> = ({ logs, anomalyData, isAuditing }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-black-matte rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[500px] border border-gray-800">
      <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-black/40">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-purple-light" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-purple-light/70">AI Analysis Terminal</h3>
        </div>
        {isAuditing && (
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-purple-light rounded-full animate-pulse shadow-[0_0_8px_#E0C3FC]" />
            <span className="text-[10px] font-bold text-purple-light/50 uppercase tracking-tighter">Live Telemetry</span>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Log Area */}
        <div 
          ref={scrollRef}
          className="flex-[2] p-6 font-mono text-[11px] leading-relaxed overflow-y-auto scroll-smooth border-r border-gray-800/50"
        >
          <AnimatePresence mode="popLayout">
            {logs.length === 0 ? (
              <p className="text-gray-600 italic">Awaiting payload and transaction verification...</p>
            ) : (
              logs.map((log, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex gap-2 mb-1"
                >
                  <ChevronRight className="w-3 h-3 text-purple-deep mt-0.5 shrink-0" />
                  <span className={log.includes('Verified') || log.includes('Success') ? "text-green-400" : "text-gray-300"}>
                    {log}
                  </span>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Visual Area */}
        <div className="flex-1 bg-black/20 p-6 flex flex-col">
          <div className="flex-1 min-h-[150px]">
            {anomalyData.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={anomalyData}>
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1E1E1E', border: '1px solid #333', fontSize: '10px' }}
                    itemStyle={{ color: '#E0C3FC' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#7B2CBF" 
                    strokeWidth={2} 
                    dot={false} 
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-800">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Anomaly Score</span>
              <span className="text-[10px] font-mono text-purple-light">
                {anomalyData.length > 0 ? anomalyData[anomalyData.length - 1].value : 0}%
              </span>
            </div>
            <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-purple-deep"
                initial={{ width: 0 }}
                animate={{ width: `${anomalyData.length > 0 ? anomalyData[anomalyData.length - 1].value : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
