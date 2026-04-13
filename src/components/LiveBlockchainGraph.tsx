import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Zap, Server, Box, Hash, Cpu } from 'lucide-react';
import * as d3 from 'd3';

interface Block {
  id: string;
  hash: string;
  tps: number;
  timestamp: number;
}

export const LiveBlockchainGraph: React.FC = () => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [currentTPS, setCurrentTPS] = useState(2450);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [maxBlocks, setMaxBlocks] = useState(10);

  // D3 Chart Logic
  useEffect(() => {
    if (!svgRef.current || blocks.length < 2) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    const margin = { top: 10, right: 10, bottom: 10, left: 10 };

    svg.selectAll("*").remove();

    const x = d3.scaleLinear()
      .domain([0, blocks.length - 1])
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain([1500, 4000])
      .range([height - margin.bottom, margin.top]);

    const line = d3.line<Block>()
      .x((_, i) => x(i))
      .y(d => y(d.tps))
      .curve(d3.curveCardinal);

    const area = d3.area<Block>()
      .x((_, i) => x(i))
      .y0(height - margin.bottom)
      .y1(d => y(d.tps))
      .curve(d3.curveCardinal);

    // Gradient
    const gradient = svg.append("defs")
      .append("linearGradient")
      .attr("id", "tps-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");

    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#6366f1")
      .attr("stop-opacity", 0.4);

    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#6366f1")
      .attr("stop-opacity", 0);

    svg.append("path")
      .datum(blocks)
      .attr("fill", "url(#tps-gradient)")
      .attr("d", area);

    svg.append("path")
      .datum(blocks)
      .attr("fill", "none")
      .attr("stroke", "#6366f1")
      .attr("stroke-width", 2)
      .attr("d", line);

    // Dots
    svg.selectAll(".dot")
      .data(blocks)
      .enter()
      .append("circle")
      .attr("cx", (_, i) => x(i))
      .attr("cy", d => y(d.tps))
      .attr("r", 3)
      .attr("fill", "#6366f1")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1);

  }, [blocks]);

  useEffect(() => {
    const updateMaxBlocks = () => {
      if (containerRef.current) {
        const height = containerRef.current.offsetHeight;
        const count = Math.floor(height / 62);
        setMaxBlocks(Math.max(1, count));
      }
    };

    const observer = new ResizeObserver(updateMaxBlocks);
    if (containerRef.current) observer.observe(containerRef.current);
    updateMaxBlocks();

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const initialBlocks: Block[] = Array.from({ length: 20 }).map((_, i) => ({
      id: Math.random().toString(36).substr(2, 9),
      hash: Math.random().toString(16).substr(2, 8).toUpperCase(),
      tps: Math.floor(Math.random() * (3800 - 1800) + 1800),
      timestamp: Date.now() - i * 1500,
    }));
    setBlocks(initialBlocks);

    const interval = setInterval(() => {
      const newTPS = Math.floor(Math.random() * (3800 - 1800) + 1800);
      setCurrentTPS(newTPS);
      
      const newBlock: Block = {
        id: Math.random().toString(36).substr(2, 9),
        hash: Math.random().toString(16).substr(2, 8).toUpperCase(),
        tps: newTPS,
        timestamp: Date.now(),
      };

      setBlocks(prev => [newBlock, ...prev.slice(0, 19)]);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-rexy-card border border-rexy-border rounded-2xl p-6 shadow-xl overflow-hidden flex flex-col h-full">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Activity className="w-4 h-4 text-rexy-primary animate-pulse" /> Network Throughput
          </h3>
          <p className="text-[10px] text-slate-500 mt-1 font-medium">Live Solana Mainnet Block Analysis</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-rexy-primary tabular-nums leading-none tracking-tighter">
            {currentTPS.toLocaleString()}
          </div>
          <div className="text-[10px] font-bold text-slate-500 uppercase mt-1 tracking-widest">TPS</div>
        </div>
      </div>

      <div className="flex-1 relative min-h-[150px] mb-6">
        <svg ref={svgRef} className="w-full h-full" />
      </div>
      
      <div ref={containerRef} className="h-[150px] flex flex-col justify-start relative py-2 overflow-hidden border-t border-rexy-border">
        <div className="space-y-2.5 relative z-10">
          <AnimatePresence initial={false} mode="popLayout">
            {blocks.slice(0, 3).map((block, index) => (
              <motion.div
                key={block.id}
                layout
                initial={{ opacity: 0, x: -50, filter: 'blur(10px)' }}
                animate={{ 
                  opacity: 1 - (index * 0.3), 
                  x: 0, 
                  scale: 1 - (index * 0.05),
                }}
                exit={{ opacity: 0, scale: 0.9, x: 100, filter: 'blur(10px)' }}
                className="flex items-center gap-4 p-2 bg-rexy-bg/50 backdrop-blur-md rounded-xl border border-rexy-border"
              >
                <div className="p-1.5 bg-rexy-primary rounded-lg shrink-0 shadow-lg shadow-rexy-primary/20">
                  <Box className="w-3 h-3 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[8px] font-mono text-rexy-primary font-black truncate tracking-tighter">
                      BLOCK #{block.hash}
                    </span>
                    <span className="text-[8px] font-bold text-slate-500 shrink-0 tabular-nums">
                      {new Date(block.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-auto pt-4 border-t border-rexy-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rexy-primary/10 rounded-lg">
            <Zap className="w-3 h-3 text-rexy-primary" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Avg Latency</p>
            <p className="text-xs font-black text-white">428ms</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <Server className="w-3 h-3 text-emerald-400" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Node Status</p>
            <p className="text-xs font-black text-emerald-400">Optimal</p>
          </div>
        </div>
      </div>
    </div>
  );
};
