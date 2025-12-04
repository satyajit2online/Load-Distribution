import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface DiagramProps {
  span: number;
  maxMoment: number;
  maxShear: number;
  load: number;
}

export const MomentDiagram: React.FC<DiagramProps> = ({ span, maxMoment }) => {
  const data = [];
  const segments = 20;
  for (let i = 0; i <= segments; i++) {
    const x = (span * i) / segments;
    // Parabolic moment M = wLx/2 - wx^2/2. Max is at L/2.
    // Normalized to match maxMoment input exactly at peak
    // M(x) = 4 * M_max * (x/L) * (1 - x/L)
    const m = 4 * maxMoment * (x / span) * (1 - x / span);
    data.push({ x: x.toFixed(2), moment: m });
  }

  return (
    <div className="h-64 w-full bg-white p-4 rounded-lg shadow-sm border border-slate-200">
      <h3 className="text-sm font-semibold text-slate-500 mb-2">Bending Moment Diagram (kNm)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="x" label={{ value: 'Span (m)', position: 'insideBottomRight', offset: -5 }} />
          <YAxis />
          <Tooltip formatter={(value: number) => value.toFixed(2)} />
          <Area type="monotone" dataKey="moment" stroke="#3b82f6" fill="#bfdbfe" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const ShearDiagram: React.FC<DiagramProps> = ({ span, maxShear }) => {
  const data = [
    { x: '0', shear: maxShear },
    { x: (span / 2).toFixed(2), shear: 0 },
    { x: span.toFixed(1), shear: -maxShear },
  ];

  return (
    <div className="h-64 w-full bg-white p-4 rounded-lg shadow-sm border border-slate-200">
      <h3 className="text-sm font-semibold text-slate-500 mb-2">Shear Force Diagram (kN)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="x" label={{ value: 'Span (m)', position: 'insideBottomRight', offset: -5 }} />
          <YAxis />
          <Tooltip formatter={(value: number) => value.toFixed(2)} />
          <ReferenceLine y={0} stroke="#000" />
          <Area type="monotone" dataKey="shear" stroke="#ef4444" fill="#fca5a5" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const BeamLoadDiagram: React.FC<{ span: number; load: number }> = ({ span, load }) => {
  return (
    <div className="h-40 w-full bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col justify-between">
      <h3 className="text-sm font-semibold text-slate-500 mb-2">Loading Diagram</h3>
      <div className="flex-1 w-full relative flex items-end justify-center pb-6">
        <svg width="100%" height="100%" viewBox="0 0 400 120" preserveAspectRatio="xMidYMid meet">
           {/* Beam */}
           <rect x="20" y="80" width="360" height="15" fill="#cbd5e1" stroke="#475569" strokeWidth="2" />
           
           {/* Left Support (Hinge) */}
           <path d="M25 95 L15 110 L35 110 Z" fill="#94a3b8" stroke="#475569" strokeWidth="2" />
           <circle cx="25" cy="113" r="3" fill="none" stroke="#475569" strokeWidth="1" />
           
           {/* Right Support (Roller) */}
           <path d="M375 95 L365 110 L385 110 Z" fill="#94a3b8" stroke="#475569" strokeWidth="2" />
           <circle cx="368" cy="115" r="3" fill="none" stroke="#475569" strokeWidth="1" />
           <circle cx="382" cy="115" r="3" fill="none" stroke="#475569" strokeWidth="1" />
           
           {/* UDL Arrows */}
           <defs>
              <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="0" refY="2" orient="auto">
                <polygon points="0 0, 6 2, 0 4" fill="#ef4444" />
              </marker>
           </defs>
           
           {/* Load Line */}
           <line x1="20" y1="20" x2="380" y2="20" stroke="#ef4444" strokeWidth="2" />
           
           {/* Individual Arrows */}
           {Array.from({ length: 9 }).map((_, i) => (
             <line 
                key={i} 
                x1={20 + (i * 45)} 
                y1="20" 
                x2={20 + (i * 45)} 
                y2="75" 
                stroke="#ef4444" 
                strokeWidth="1.5" 
                markerEnd="url(#arrowhead)" 
             />
           ))}

           {/* Load Label */}
           <text x="200" y="15" textAnchor="middle" className="text-xs fill-red-600 font-bold">
             w = {load.toFixed(2)} kN/m
           </text>

           {/* Span Label */}
           <line x1="20" y1="115" x2="20" y2="125" stroke="#94a3b8" />
           <line x1="380" y1="115" x2="380" y2="125" stroke="#94a3b8" />
           <line x1="20" y1="120" x2="380" y2="120" stroke="#94a3b8" />
           <text x="200" y="135" textAnchor="middle" className="text-xs fill-slate-500">
             L = {span} m
           </text>
        </svg>
      </div>
    </div>
  );
};