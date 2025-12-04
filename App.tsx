import React, { useState } from 'react';
import { ConcreteGrade, DesignInputs, SteelGrade, SlabSideConfig } from './types';
import { calculateLoads, analyzeBeam, designBeam } from './utils/rccCalculations';
import { generateDesignReport } from './services/geminiService';
import { MomentDiagram, ShearDiagram, BeamLoadDiagram } from './components/Diagrams';
import { CrossSection } from './components/CrossSection';
import { Calculator, FileText, AlertTriangle, CheckCircle, BrainCircuit, Info } from 'lucide-react';

const App: React.FC = () => {
  const [inputs, setInputs] = useState<DesignInputs>({
    slabThickness: 125,
    liveLoad: 3.0,
    floorFinish: 1.0,
    
    leftSlab: {
      enabled: true,
      type: 'TwoWay',
      lx: 3.0,
      ly: 4.5,
      supportEdge: 'Short' // Triangular load
    },
    rightSlab: {
      enabled: false,
      type: 'TwoWay',
      lx: 3.0,
      ly: 4.5,
      supportEdge: 'Long'
    },

    beamWidth: 230,
    beamDepth: 450,
    beamClearSpan: 3.0,
    effectiveCover: 25,
    wallHeight: 3.0,
    wallThickness: 230,
    fck: ConcreteGrade.M20,
    fy: SteelGrade.Fe500,
    mainBarDia: 16,
    stirrupBarDia: 8,
  });

  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const loads = calculateLoads(inputs);
  const analysis = analyzeBeam(inputs, loads);
  const design = designBeam(inputs, analysis);

  const handleInputChange = (field: keyof DesignInputs, value: any) => {
    setInputs(prev => ({ ...prev, [field]: parseFloat(value) || value }));
    setAiReport(null);
  };

  const handleSlabChange = (side: 'leftSlab' | 'rightSlab', field: keyof SlabSideConfig, value: any) => {
    setInputs(prev => ({
      ...prev,
      [side]: {
        ...prev[side],
        [field]: value
      }
    }));
    setAiReport(null);
  };

  const handleAiConsultation = async () => {
    setIsGeneratingAi(true);
    const report = await generateDesignReport(inputs, loads, analysis, design);
    setAiReport(report);
    setIsGeneratingAi(false);
  };

  const renderSlabConfig = (side: 'leftSlab' | 'rightSlab', title: string) => {
    const config = inputs[side];
    return (
      <div className={`p-3 rounded-lg border ${config.enabled ? 'bg-slate-800 border-slate-700' : 'bg-slate-800/50 border-slate-800 border-dashed'}`}>
        <div className="flex items-center justify-between mb-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={config.enabled}
              onChange={(e) => handleSlabChange(side, 'enabled', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className={`text-sm font-semibold ${config.enabled ? 'text-white' : 'text-slate-500'}`}>{title}</span>
          </label>
          {config.enabled && (
             <span className="text-[10px] text-blue-400 font-mono uppercase tracking-wider">
               {config.type === 'OneWay' ? 'Rectangular Load' : (config.supportEdge === 'Short' ? 'Triangular Load' : 'Trapezoidal Load')}
             </span>
          )}
        </div>

        {config.enabled && (
          <div className="space-y-3 animate-fade-in">
             <div className="flex bg-slate-900 rounded p-1 text-xs">
                <button 
                  onClick={() => handleSlabChange(side, 'type', 'OneWay')}
                  className={`flex-1 py-1 rounded transition-colors ${config.type === 'OneWay' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  One Way
                </button>
                <button 
                  onClick={() => handleSlabChange(side, 'type', 'TwoWay')}
                  className={`flex-1 py-1 rounded transition-colors ${config.type === 'TwoWay' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Two Way
                </button>
             </div>

             <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Lx (Short Span)</label>
                  <input 
                    type="number" step="0.1"
                    value={config.lx}
                    onChange={(e) => handleSlabChange(side, 'lx', parseFloat(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white focus:border-blue-500 outline-none"
                  />
                </div>
                {config.type === 'TwoWay' && (
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Ly (Long Span)</label>
                    <input 
                      type="number" step="0.1"
                      value={config.ly}
                      onChange={(e) => handleSlabChange(side, 'ly', parseFloat(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white focus:border-blue-500 outline-none"
                    />
                  </div>
                )}
             </div>

             {config.type === 'TwoWay' && (
               <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Beam Supports</label>
                  <div className="flex bg-slate-900 rounded p-0.5 text-[10px]">
                    <button 
                      onClick={() => handleSlabChange(side, 'supportEdge', 'Short')}
                      className={`flex-1 py-1 rounded transition-colors ${config.supportEdge === 'Short' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                      title="Generates Triangular Load"
                    >
                      Short Edge
                    </button>
                    <button 
                      onClick={() => handleSlabChange(side, 'supportEdge', 'Long')}
                      className={`flex-1 py-1 rounded transition-colors ${config.supportEdge === 'Long' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                      title="Generates Trapezoidal Load"
                    >
                      Long Edge
                    </button>
                  </div>
               </div>
             )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* LEFT PANEL: INPUTS */}
      <div className="w-full md:w-1/3 bg-slate-900 text-slate-100 p-6 overflow-y-auto h-screen sticky top-0 custom-scrollbar">
        <div className="flex items-center gap-2 mb-6">
          <Calculator className="w-6 h-6 text-blue-400" />
          <h1 className="text-xl font-bold tracking-tight">RCC Beam Pro</h1>
        </div>

        <div className="space-y-8">
          
          {/* Global Loads */}
          <section className="space-y-3">
             <h2 className="text-xs uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-700 pb-1">General Slab Loads</h2>
             <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Thickness</label>
                  <input 
                    type="number" 
                    value={inputs.slabThickness} 
                    onChange={(e) => handleInputChange('slabThickness', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm focus:border-blue-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-500">mm</span>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Live Load</label>
                  <input 
                    type="number" step="0.5"
                    value={inputs.liveLoad} 
                    onChange={(e) => handleInputChange('liveLoad', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm focus:border-blue-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-500">kN/m²</span>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Floor Fin.</label>
                  <input 
                    type="number" step="0.5"
                    value={inputs.floorFinish} 
                    onChange={(e) => handleInputChange('floorFinish', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm focus:border-blue-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-500">kN/m²</span>
                </div>
             </div>
          </section>

          {/* Slab Configuration */}
          <section className="space-y-3">
            <h2 className="text-xs uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-700 pb-1 flex justify-between">
               Slab Load Transfer
               <Info className="w-3 h-3 text-slate-500" />
            </h2>
            <div className="space-y-3">
              {renderSlabConfig('leftSlab', 'Left Side Slab')}
              {renderSlabConfig('rightSlab', 'Right Side Slab')}
            </div>
          </section>

           {/* Beam Geometry */}
           <section className="space-y-3">
            <h2 className="text-xs uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-700 pb-1">Beam Geometry & Wall</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400">Width (mm)</label>
                <input 
                  type="number" step="10"
                  value={inputs.beamWidth} 
                  onChange={(e) => handleInputChange('beamWidth', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Depth (mm)</label>
                <input 
                  type="number" step="10"
                  value={inputs.beamDepth} 
                  onChange={(e) => handleInputChange('beamDepth', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Span (m)</label>
                <input 
                  type="number" step="0.1"
                  value={inputs.beamClearSpan} 
                  onChange={(e) => handleInputChange('beamClearSpan', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm focus:border-blue-500 outline-none"
                />
              </div>
               <div>
                <label className="text-xs text-slate-400">Eff. Cover (mm)</label>
                <input 
                  type="number" 
                  value={inputs.effectiveCover} 
                  onChange={(e) => handleInputChange('effectiveCover', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm focus:border-blue-500 outline-none"
                />
              </div>
            </div>
             <div className="grid grid-cols-2 gap-4 mt-2">
               <div>
                <label className="text-xs text-slate-400">Wall Ht (m)</label>
                <input 
                  type="number" step="0.1"
                  value={inputs.wallHeight} 
                  onChange={(e) => handleInputChange('wallHeight', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm focus:border-blue-500 outline-none"
                />
              </div>
               <div>
                <label className="text-xs text-slate-400">Wall Thk (mm)</label>
                <input 
                  type="number" 
                  value={inputs.wallThickness} 
                  onChange={(e) => handleInputChange('wallThickness', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm focus:border-blue-500 outline-none"
                />
              </div>
             </div>
          </section>

          {/* Materials */}
          <section className="space-y-3 pb-8">
             <h2 className="text-xs uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-700 pb-1">Materials</h2>
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="text-xs text-slate-400">Concrete</label>
                   <select 
                    value={inputs.fck}
                    onChange={(e) => handleInputChange('fck', parseInt(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm focus:border-blue-500 outline-none"
                   >
                     <option value={20}>M20</option>
                     <option value={25}>M25</option>
                     <option value={30}>M30</option>
                   </select>
                </div>
                <div>
                   <label className="text-xs text-slate-400">Steel</label>
                   <select 
                    value={inputs.fy}
                    onChange={(e) => handleInputChange('fy', parseInt(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm focus:border-blue-500 outline-none"
                   >
                     <option value={415}>Fe415</option>
                     <option value={500}>Fe500</option>
                   </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Main Bar (mm)</label>
                   <select 
                    value={inputs.mainBarDia}
                    onChange={(e) => handleInputChange('mainBarDia', parseInt(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm focus:border-blue-500 outline-none"
                   >
                     <option value={10}>10</option>
                     <option value={12}>12</option>
                     <option value={16}>16</option>
                     <option value={20}>20</option>
                     <option value={25}>25</option>
                   </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Stirrup (mm)</label>
                   <select 
                    value={inputs.stirrupBarDia}
                    onChange={(e) => handleInputChange('stirrupBarDia', parseInt(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm focus:border-blue-500 outline-none"
                   >
                     <option value={6}>6</option>
                     <option value={8}>8</option>
                     <option value={10}>10</option>
                   </select>
                </div>
             </div>
          </section>
        </div>
      </div>

      {/* RIGHT PANEL: RESULTS */}
      <div className="w-full md:w-2/3 p-4 md:p-8 overflow-y-auto">
        
        {/* Header Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
           <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <p className="text-xs text-slate-500">Total Factored Load</p>
              <p className="text-2xl font-bold text-slate-800">{loads.totalDesignUDL.toFixed(2)} <span className="text-sm font-normal text-slate-400">kN/m</span></p>
           </div>
           <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <p className="text-xs text-slate-500">Design Moment (Mu)</p>
              <p className="text-2xl font-bold text-slate-800">{analysis.maxMoment.toFixed(1)} <span className="text-sm font-normal text-slate-400">kNm</span></p>
           </div>
           <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <p className="text-xs text-slate-500">Design Shear (Vu)</p>
              <p className="text-2xl font-bold text-slate-800">{analysis.maxShear.toFixed(1)} <span className="text-sm font-normal text-slate-400">kN</span></p>
           </div>
           <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <p className="text-xs text-slate-500">Design Status</p>
              <p className={`text-lg font-bold ${design.isDoublyReinforced ? 'text-red-600' : 'text-emerald-600'} flex items-center gap-1`}>
                 {design.isDoublyReinforced ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
                 {design.isDoublyReinforced ? 'Over Reinf.' : 'Safe'}
              </p>
           </div>
        </div>

        {/* Load Breakdown Table */}
        <div className="mb-8">
           <h3 className="text-lg font-bold text-slate-800 mb-4">Load Calculation</h3>
           <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="min-w-full bg-white text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="py-2 px-4 text-left font-medium text-slate-500">Source</th>
                    <th className="py-2 px-4 text-left font-medium text-slate-500">Calculation logic</th>
                    <th className="py-2 px-4 text-right font-medium text-slate-500">Value (kN/m)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   <tr>
                      <td className="py-2 px-4 text-slate-700">Left Slab Load</td>
                      <td className="py-2 px-4 text-slate-500 text-xs">
                        {!inputs.leftSlab.enabled ? 'No Slab' : 
                          inputs.leftSlab.type === 'OneWay' ? 'One-Way (Lx/2)' : 
                          inputs.leftSlab.supportEdge === 'Short' ? 'Two-Way Triangular (Lx/3)' : 'Two-Way Trapezoidal'}
                      </td>
                      <td className="py-2 px-4 text-right font-mono text-slate-700">{loads.udlFromLeftSlab.toFixed(2)}</td>
                   </tr>
                   <tr>
                      <td className="py-2 px-4 text-slate-700">Right Slab Load</td>
                      <td className="py-2 px-4 text-slate-500 text-xs">
                        {!inputs.rightSlab.enabled ? 'No Slab' : 
                          inputs.rightSlab.type === 'OneWay' ? 'One-Way (Lx/2)' : 
                          inputs.rightSlab.supportEdge === 'Short' ? 'Two-Way Triangular (Lx/3)' : 'Two-Way Trapezoidal'}
                      </td>
                      <td className="py-2 px-4 text-right font-mono text-slate-700">{loads.udlFromRightSlab.toFixed(2)}</td>
                   </tr>
                   <tr>
                      <td className="py-2 px-4 text-slate-700">Beam Self Weight</td>
                      <td className="py-2 px-4 text-slate-500 text-xs">{inputs.beamWidth} x {inputs.beamDepth} x 25 kN/m³</td>
                      <td className="py-2 px-4 text-right font-mono text-slate-700">{loads.beamSelfWeight.toFixed(2)}</td>
                   </tr>
                   <tr>
                      <td className="py-2 px-4 text-slate-700">Wall Load</td>
                      <td className="py-2 px-4 text-slate-500 text-xs">{inputs.wallThickness}mm x {inputs.wallHeight}m x 20 kN/m³</td>
                      <td className="py-2 px-4 text-right font-mono text-slate-700">{loads.wallLoad.toFixed(2)}</td>
                   </tr>
                   <tr className="bg-slate-50 font-bold">
                      <td className="py-2 px-4 text-slate-900">Total Factored (x1.5)</td>
                      <td className="py-2 px-4"></td>
                      <td className="py-2 px-4 text-right font-mono text-blue-600">{loads.totalDesignUDL.toFixed(2)}</td>
                   </tr>
                </tbody>
              </table>
           </div>
        </div>

        {/* Visualization Grid */}
        <div className="grid grid-cols-1 gap-6 mb-8">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MomentDiagram span={inputs.beamClearSpan} maxMoment={analysis.maxMoment} maxShear={analysis.maxShear} load={loads.totalDesignUDL} />
                <BeamLoadDiagram span={inputs.beamClearSpan} load={loads.totalDesignUDL} />
             </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <ShearDiagram span={inputs.beamClearSpan} maxMoment={analysis.maxMoment} maxShear={analysis.maxShear} load={loads.totalDesignUDL} />
                 <CrossSection 
                   width={inputs.beamWidth} 
                   depth={inputs.beamDepth} 
                   numBars={design.numberOfBars} 
                   barDia={inputs.mainBarDia} 
                   stirrupDia={inputs.stirrupBarDia}
                   cover={inputs.effectiveCover}
                 />
             </div>
        </div>

        {/* Detailed Design Results */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-400" />
              Reinforcement & Checks
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {/* Flexure */}
               <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Flexure Design</h4>
                  
                  {design.isDoublyReinforced && (
                    <div className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">
                      <strong>Warning:</strong> The required Moment ({analysis.maxMoment.toFixed(1)}) exceeds the Limiting Moment ({design.muLim.toFixed(1)}). The section is doubly reinforced. Please increase depth.
                    </div>
                  )}

                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-600 text-sm">Required Ast</span>
                    <span className="font-mono font-medium text-slate-900">{design.astRequired.toFixed(0)} mm²</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-600 text-sm">Provided Bars</span>
                    <span className="font-mono font-bold text-slate-900">{design.numberOfBars} nos. T{inputs.mainBarDia}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-600 text-sm">Provided Area</span>
                    <span className="font-mono font-medium text-slate-900">{design.astProvided.toFixed(0)} mm²</span>
                  </div>
                  <div className="flex justify-between pb-2">
                    <span className="text-slate-600 text-sm">Percentage Steel (Pt)</span>
                    <span className="font-mono font-medium text-slate-900">{design.ptProvided.toFixed(2)} %</span>
                  </div>
               </div>

               {/* Shear */}
               <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-red-500 uppercase tracking-wide">Shear Design</h4>
                  
                  {design.stirrupSpacing === 0 ? (
                    <div className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">
                      <strong>Shear Failure:</strong> Stress exceeds {'$\\tau_{c,max}$'}. Increase section size immediately.
                    </div>
                  ) : (
                     <>
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-600 text-sm">Nominal Stress ($\tau_v$)</span>
                        <span className="font-mono font-medium text-slate-900">{design.tauV} N/mm²</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-600 text-sm">Concrete Capacity ($\tau_c$)</span>
                        <span className="font-mono font-medium text-slate-900">{design.tauC} N/mm²</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-600 text-sm">Shear Reinforcement</span>
                        <span className="font-mono font-medium text-slate-900 text-right">
                          {design.shearReinforcementRequired ? "Design Stirrups Req." : "Nominal Stirrups Req."}
                        </span>
                      </div>
                      <div className="flex justify-between pb-2 items-center bg-green-50 p-2 rounded">
                        <span className="text-green-800 text-sm font-bold">Use Stirrups</span>
                        <span className="font-mono font-bold text-green-900">
                           T{inputs.stirrupBarDia} @ {design.stirrupSpacing} mm c/c
                        </span>
                      </div>
                     </>
                  )}
               </div>

                {/* Deflection */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-purple-600 uppercase tracking-wide">Deflection Check</h4>
                   
                  <div className={`p-3 rounded border ${design.deflectionCheckPassed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <div className={`flex items-center gap-2 font-bold ${design.deflectionCheckPassed ? 'text-green-700' : 'text-red-700'}`}>
                         {design.deflectionCheckPassed ? <CheckCircle size={16}/> : <AlertTriangle size={16}/>}
                         {design.deflectionCheckPassed ? "Check Passed" : "Check Failed"}
                      </div>
                      {!design.deflectionCheckPassed && <div className="text-xs text-red-600 mt-1">Increase Depth or Ast</div>}
                  </div>

                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-600 text-sm">Basic L/d</span>
                    <span className="font-mono font-medium text-slate-900">{design.basicLbyD}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-600 text-sm">Mod. Factor ($k_t$)</span>
                    <span className="font-mono font-medium text-slate-900">{design.modificationFactorKt.toFixed(2)}</span>
                  </div>
                   <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-600 text-sm">Allowable L/d</span>
                    <span className="font-mono font-medium text-slate-900">{design.allowableLbyD.toFixed(2)}</span>
                  </div>
                   <div className="flex justify-between pb-2">
                    <span className="text-slate-600 text-sm">Actual L/d</span>
                    <span className={`font-mono font-bold ${design.deflectionCheckPassed ? 'text-slate-900' : 'text-red-600'}`}>{design.actualLbyD.toFixed(2)}</span>
                  </div>
               </div>
            </div>
        </div>

        {/* AI Review Section */}
        <div className="mb-12">
           <button 
             onClick={handleAiConsultation}
             disabled={isGeneratingAi}
             className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed"
           >
             {isGeneratingAi ? (
               <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Analyzing Design...
               </>
             ) : (
               <>
                <BrainCircuit className="w-5 h-5" />
                Generate AI Expert Report
               </>
             )}
           </button>

           {aiReport && (
             <div className="mt-6 bg-slate-800 text-slate-100 p-6 rounded-xl shadow-xl border border-slate-700 animate-fade-in">
               <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-violet-400">
                 <BrainCircuit className="w-5 h-5" />
                 AI Design Review
               </h3>
               <div className="prose prose-invert prose-sm max-w-none">
                 <div dangerouslySetInnerHTML={{ __html: aiReport.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') }} />
               </div>
             </div>
           )}
        </div>

      </div>
    </div>
  );
};

export default App;