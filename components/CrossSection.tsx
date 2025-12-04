import React from 'react';

interface CrossSectionProps {
  width: number; // mm
  depth: number; // mm
  numBars: number;
  barDia: number; // mm
  stirrupDia: number;
  cover: number;
}

export const CrossSection: React.FC<CrossSectionProps> = ({
  width,
  depth,
  numBars,
  barDia,
  stirrupDia,
  cover,
}) => {
  // Scaling factor to fit in viewBox
  const scale = 250 / Math.max(width, depth);
  const scaledW = width * scale;
  const scaledH = depth * scale;
  
  const cx = 150; // Center of SVG
  const cy = 150;
  
  const x = cx - scaledW / 2;
  const y = cy - scaledH / 2;
  
  // Bars logic
  // Simple layout: assume single layer for visualization for simplicity, max 6 bars per row
  const renderBars = () => {
    const bars = [];
    const sidePadding = (cover + stirrupDia) * scale;
    const availableWidth = scaledW - 2 * sidePadding;
    
    // Safety check for calculation issues
    if (numBars <= 0) return null;

    const spacing = numBars > 1 ? availableWidth / (numBars - 1) : 0;
    const barRadius = (barDia * scale) / 2;
    const bottomY = y + scaledH - sidePadding - barRadius;

    for (let i = 0; i < numBars; i++) {
        // If too many bars, visualize max 5 to avoid clutter, add text +
        if(i > 4) break; 
        
        bars.push(
            <circle 
                key={i} 
                cx={x + sidePadding + (i * spacing)} 
                cy={bottomY} 
                r={Math.max(barRadius, 2)} 
                fill="#dc2626" 
                stroke="#7f1d1d" 
                strokeWidth="1"
            />
        );
    }
    return bars;
  };

  return (
    <div className="flex flex-col items-center justify-center bg-white p-4 rounded-lg shadow-sm border border-slate-200 h-64">
        <h3 className="text-sm font-semibold text-slate-500 mb-2">Cross Section</h3>
        <svg width="300" height="300" viewBox="0 0 300 300" className="w-full h-full">
            {/* Concrete Face */}
            <rect 
                x={x} 
                y={y} 
                width={scaledW} 
                height={scaledH} 
                fill="#e2e8f0" 
                stroke="#64748b" 
                strokeWidth="2" 
            />
            
            {/* Stirrup (approximate inset) */}
            <rect 
                x={x + (cover * scale)} 
                y={y + (cover * scale)} 
                width={scaledW - (2 * cover * scale)} 
                height={scaledH - (2 * cover * scale)} 
                fill="none" 
                stroke="#0f172a" 
                strokeWidth="2" 
                rx="4"
            />
            
            {/* Top Hanger Bars (Dummy, usually 2-10mm) */}
            <circle cx={x + (cover + stirrupDia)*scale + 2} cy={y + (cover + stirrupDia)*scale + 2} r={3} fill="#94a3b8" />
            <circle cx={x + scaledW - ((cover + stirrupDia)*scale + 2)} cy={y + (cover + stirrupDia)*scale + 2} r={3} fill="#94a3b8" />

            {/* Main Bars */}
            {renderBars()}
            
            {/* Labels */}
            <text x={x - 10} y={cy} textAnchor="end" className="text-xs fill-slate-500 font-mono">{depth}mm</text>
            <text x={cx} y={y + scaledH + 20} textAnchor="middle" className="text-xs fill-slate-500 font-mono">{width}mm</text>
        </svg>
        <div className="text-xs text-slate-500 mt-2">
            {numBars} - T{barDia} Bottom Reinf.
        </div>
    </div>
  );
};
