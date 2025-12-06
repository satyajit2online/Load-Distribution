import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface DiagramProps {
  data: { x: number; val: number }[];
  color: string;
  fill: string;
  title: string;
  yLabel: string;
}

export const GenericDiagram: React.FC<DiagramProps> = ({ data, color, fill, title, yLabel }) => {
  // Format data for Recharts (x needs to be string/number that Recharts likes)
  const chartData = data.map(d => ({ x: d.x.toFixed(2), value: d.val }));

  return (
    <div className="h-64 w-full bg-white p-4 rounded-lg shadow-sm border border-slate-200">
      <h3 className="text-sm font-semibold text-slate-500 mb-2">{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="x" label={{ value: 'Span (m)', position: 'insideBottomRight', offset: -5 }} />
          <YAxis label={{ value: yLabel, angle: -90, position: 'insideLeft' }} />
          <Tooltip formatter={(value: number) => value.toFixed(2)} />
          <ReferenceLine y={0} stroke="#000" />
          <Area type="monotone" dataKey="value" stroke={color} fill={fill} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const MomentDiagram: React.FC<{ data: {x:number, val:number}[] }> = ({ data }) => {
  return <GenericDiagram data={data} color="#3b82f6" fill="#bfdbfe" title="Bending Moment Diagram (kNm)" yLabel="Moment" />;
};

export const ShearDiagram: React.FC<{ data: {x:number, val:number}[] }> = ({ data }) => {
  return <GenericDiagram data={data} color="#ef4444" fill="#fca5a5" title="Shear Force Diagram (kN)" yLabel="Shear" />;
};

interface BeamLoadProps {
  span: number;
  udl: number;
  pointLoads: { value: number; distance: number }[];
}

export const BeamLoadDiagram: React.FC<BeamLoadProps> = ({ span, udl, pointLoads }) => {
  // SVG drawing logic
  const width = 400;
  const beamY = 80;
  const paddingX = 20;
  const drawWidth = width - 2 * paddingX;
  
  const getX = (dist: number) => paddingX + (dist / span) * drawWidth;

  return (
    <div className="h-40 w-full bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col justify-between">
      <h3 className="text-sm font-semibold text-slate-500 mb-2">Loading Diagram (Factored Loads)</h3>
      <div className="flex-1 w-full relative flex items-end justify-center pb-6">
        <svg width="100%" height="100%" viewBox="0 0 400 120" preserveAspectRatio="xMidYMid meet">
           {/* Beam */}
           <rect x={paddingX} y={beamY} width={drawWidth} height="15" fill="#cbd5e1" stroke="#475569" strokeWidth="2" />
           
           {/* Left Support (Hinge) */}
           <path d={`${paddingX+5} ${beamY+15} L${paddingX-5} ${beamY+30} L${paddingX+15} ${beamY+30} Z`} fill="#94a3b8" stroke="#475569" strokeWidth="2" />
           <circle cx={paddingX+5} cy={beamY+33} r="3" fill="none" stroke="#475569" strokeWidth="1" />
           
           {/* Right Support (Roller) */}
           <path d={`${width-paddingX-5} ${beamY+15} L${width-paddingX-15} ${beamY+30} L${width-paddingX+5} ${beamY+30} Z`} fill="#94a3b8" stroke="#475569" strokeWidth="2" />
           <circle cx={width-paddingX-12} cy={beamY+35} r="3" fill="none" stroke="#475569" strokeWidth="1" />
           <circle cx={width-paddingX+2} cy={beamY+35} r="3" fill="none" stroke="#475569" strokeWidth="1" />
           
           {/* UDL Arrows & Label */}
           <defs>
              <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="0" refY="2" orient="auto">
                <polygon points="0 0, 6 2, 0 4" fill="#ef4444" />
              </marker>
              <marker id="arrowheadBlue" markerWidth="6" markerHeight="4" refX="0" refY="2" orient="auto">
                <polygon points="0 0, 6 2, 0 4" fill="#3b82f6" />
              </marker>
           </defs>
           
           {/* UDL Line */}
           <line x1={paddingX} y1="20" x2={width-paddingX} y2="20" stroke="#ef4444" strokeWidth="2" />
           <text x={width/2} y="15" textAnchor="middle" className="text-xs fill-red-600 font-bold">
             UDL = {udl.toFixed(2)} kN/m
           </text>
           
           {/* UDL Individual Arrows */}
           {Array.from({ length: 9 }).map((_, i) => (
             <line 
                key={i} 
                x1={paddingX + (i * (drawWidth/8))} 
                y1="20" 
                x2={paddingX + (i * (drawWidth/8))} 
                y2={beamY - 5} 
                stroke="#ef4444" 
                strokeWidth="1.5" 
                markerEnd="url(#arrowhead)" 
             />
           ))}

           {/* Point Loads */}
           {pointLoads.map((pl, idx) => {
             const xPos = getX(pl.distance);
             return (
               <g key={idx}>
                 <line 
                   x1={xPos} y1="35" 
                   x2={xPos} y2={beamY - 5} 
                   stroke="#3b82f6" 
                   strokeWidth="3" 
                   markerEnd="url(#arrowheadBlue)" 
                 />
                 <text x={xPos} y="30" textAnchor="middle" className="text-xs fill-blue-600 font-bold">
                   {pl.value.toFixed(1)} kN
                 </text>
               </g>
             );
           })}

           {/* Span Label */}
           <line x1={paddingX} y1={beamY+35} x2={paddingX} y2={beamY+45} stroke="#94a3b8" />
           <line x1={width-paddingX} y1={beamY+35} x2={width-paddingX} y2={beamY+45} stroke="#94a3b8" />
           <line x1={paddingX} y1={beamY+40} x2={width-paddingX} y2={beamY+40} stroke="#94a3b8" />
           <text x={width/2} y={beamY+55} textAnchor="middle" className="text-xs fill-slate-500">
             L = {span} m
           </text>
        </svg>
      </div>
    </div>
  );
};