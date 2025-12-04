import { AnalysisResult, ConcreteGrade, DesignInputs, DesignResult, LoadResult, SteelGrade, SlabSideConfig } from '../types';

const CONCRETE_DENSITY = 25; // kN/m3
const MASONRY_DENSITY = 20; // kN/m3
const PARTIAL_SAFETY_FACTOR_LOAD = 1.5;

// Interpolation helper for Tau_c (Table 19 IS 456)
const getTauC = (pt: number, fck: number): number => {
  const ptLimited = Math.min(Math.max(pt, 0.15), 3.0);
  
  // Base values for pt=1.0 roughly
  let baseVal = 0;
  if (fck === 20) baseVal = 0.62;
  else if (fck === 25) baseVal = 0.64;
  else if (fck >= 30) baseVal = 0.66;
  
  // Using linear interpolation between known points for M20
  const points = [0.15, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
  const m20vals = [0.28, 0.36, 0.48, 0.56, 0.62, 0.67, 0.72, 0.79];
  
  // Find index
  let idx = 0;
  while(idx < points.length - 1 && ptLimited > points[idx+1]) idx++;
  
  const t1 = m20vals[idx];
  const t2 = m20vals[Math.min(idx+1, points.length-1)];
  const p1 = points[idx];
  const p2 = points[Math.min(idx+1, points.length-1)];
  
  let tauM20 = t1;
  if(p2 !== p1) {
    tauM20 = t1 + (t2 - t1) * (ptLimited - p1) / (p2 - p1);
  }
  
  // Adjust for higher grades slightly
  const gradeFactor = 1 + (fck - 20) * 0.01; 
  
  return parseFloat((tauM20 * gradeFactor).toFixed(2));
};

const calculateSlabLoadPerMeter = (config: SlabSideConfig, totalAreaLoad: number): number => {
  if (!config.enabled) return 0;

  const lx = config.lx;
  const ly = config.ly;

  if (config.type === 'OneWay') {
    // One Way Slab
    // Assuming the beam supports the slab (Main Beam). 
    // Load is rectangular: w * Lx / 2
    return (totalAreaLoad * lx) / 2;
  } else {
    // Two Way Slab
    // Determine shape based on supported edge
    if (config.supportEdge === 'Short') {
      // Beam supports Short Edge -> Triangular Load
      // Equivalent UDL for Shear/Moment is approx w*Lx/3
      return (totalAreaLoad * lx) / 3;
    } else {
      // Beam supports Long Edge -> Trapezoidal Load
      // Formula: w = (w * lx / 2) * (1 - 1/(3 * beta^2)) where beta = ly/lx
      const beta = ly / lx;
      const factor = 1 - (1 / (3 * Math.pow(beta, 2)));
      return (totalAreaLoad * lx) / 2 * factor;
    }
  }
};

export const calculateLoads = (inputs: DesignInputs): LoadResult => {
  // 1. Slab Load per m2
  const dSlabM = inputs.slabThickness / 1000;
  const slabSelfWeight = dSlabM * CONCRETE_DENSITY; // kN/m2
  const totalSlabLoadArea = slabSelfWeight + inputs.liveLoad + inputs.floorFinish;
  
  // 2. Load Transfer to Beam (Left and Right)
  const udlFromLeftSlab = calculateSlabLoadPerMeter(inputs.leftSlab, totalSlabLoadArea);
  const udlFromRightSlab = calculateSlabLoadPerMeter(inputs.rightSlab, totalSlabLoadArea);
  const udlTotalSlab = udlFromLeftSlab + udlFromRightSlab;

  // 3. Beam Self Weight
  const bM = inputs.beamWidth / 1000;
  const dM = inputs.beamDepth / 1000;
  const beamSelfWeight = bM * dM * CONCRETE_DENSITY;
  
  // 4. Wall Load
  const wallThickM = inputs.wallThickness / 1000;
  const wallLoad = wallThickM * inputs.wallHeight * MASONRY_DENSITY;
  
  // 5. Total Factored Load
  const totalServiceLoad = udlTotalSlab + beamSelfWeight + wallLoad;
  const totalDesignUDL = totalServiceLoad * PARTIAL_SAFETY_FACTOR_LOAD;
  
  return {
    slabSelfWeight,
    totalSlabLoadArea,
    udlFromLeftSlab,
    udlFromRightSlab,
    udlTotalSlab,
    beamSelfWeight,
    wallLoad,
    totalDesignUDL
  };
};

export const analyzeBeam = (inputs: DesignInputs, loads: LoadResult): AnalysisResult => {
  const L = inputs.beamClearSpan;
  const w = loads.totalDesignUDL;
  
  const maxMoment = (w * L * L) / 8;
  const maxShear = (w * L) / 2;
  const effectiveDepth = inputs.beamDepth - inputs.effectiveCover;
  
  return {
    maxMoment,
    maxShear,
    effectiveDepth
  };
};

// Check Deflection as per IS 456 Cl 23.2.1
const checkDeflection = (
  spanM: number,
  effDepthMm: number,
  astRequired: number,
  astProvided: number,
  b: number,
  fy: number
) => {
  // Basic L/d ratio for simply supported beam
  const basicLbyD = 20;

  // Percentage of tension reinforcement
  const pt = (astProvided / (b * effDepthMm)) * 100;
  
  // Service stress in steel
  // fs = 0.58 * fy * (AreaRequired / AreaProvided)
  const fs = 0.58 * fy * (astRequired / astProvided);

  // Modification Factor (Kt) for Tension Reinforcement (IS 456 Fig 4)
  // Formula approximation: 1 / (0.225 + 0.0032*fs - 0.625*log10(pt))
  // Ensuring denominator is valid and pt is handled correctly for log10
  
  // Guard against very low Pt causing math errors
  const safePt = Math.max(pt, 0.1); 
  
  let denominator = 0.225 + (0.0032 * fs) - (0.625 * Math.log10(safePt));
  
  // Kt cannot be greater than 2.0 (code limit implied in charts)
  // If denominator is <= 0 or results in high value, clamp it.
  let kt = 1.0;
  if (denominator > 0) {
      kt = 1 / denominator;
  }
  
  // Clamp Kt between 0.7 and 2.0 based on typical chart range
  kt = Math.min(Math.max(kt, 0.7), 2.0);

  const allowableLbyD = basicLbyD * kt;
  const actualLbyD = (spanM * 1000) / effDepthMm;

  return {
    actualLbyD,
    basicLbyD,
    modificationFactorKt: kt,
    allowableLbyD,
    deflectionCheckPassed: actualLbyD <= allowableLbyD
  };
};

export const designBeam = (inputs: DesignInputs, analysis: AnalysisResult): DesignResult => {
  const { fck, fy, beamWidth: b, stirrupBarDia } = inputs;
  const { maxMoment: Mu, maxShear: Vu, effectiveDepth: d } = analysis;
  
  // 1. Check Limiting Moment
  let k_lim = 0.138;
  if (fy === SteelGrade.Fe500) k_lim = 0.133;
  if (fy === SteelGrade.Fe550) k_lim = 0.129; 
  
  const MuLim = k_lim * (fck as number) * b * d * d / 1000000; // kNm
  
  const isDoublyReinforced = Mu > MuLim;
  
  // 2. Calculate Ast
  let astRequired = 0;
  if (isDoublyReinforced) {
     const factor = 1 - Math.sqrt(1 - (4.6 * (MuLim * 1000000)) / ((fck as number) * b * d * d));
     astRequired = (0.5 * (fck as number) / fy) * factor * b * d;
  } else {
    const factor = 1 - Math.sqrt(Math.max(0, 1 - (4.6 * (Mu * 1000000)) / ((fck as number) * b * d * d)));
    astRequired = (0.5 * (fck as number) / fy) * factor * b * d;
  }
  
  // Min Ast Check (IS 456)
  const astMin = (0.85 * b * d) / fy;
  astRequired = Math.max(astRequired, astMin);
  
  // Provide bars
  const areaOneBar = (Math.PI / 4) * Math.pow(inputs.mainBarDia, 2);
  const numberOfBars = Math.ceil(astRequired / areaOneBar);
  const astProvided = numberOfBars * areaOneBar;
  
  // 3. Shear Design
  const tv = (Vu * 1000) / (b * d); // N/mm2
  const ptProvided = (astProvided / (b * d)) * 100;
  const tc = getTauC(ptProvided, (fck as number));
  const tcMax = (fck as number) === 40 ? 4.0 : ((fck as number) >= 30 ? 3.5 : ((fck as number) >= 25 ? 3.1 : 2.8)); 
  
  let stirrupSpacing = 0;
  let shearReinforcementRequired = false;
  
  if (tv > tcMax) {
    stirrupSpacing = 0; // Fail
  } else if (tv < tc) {
    shearReinforcementRequired = false;
    const asv = 2 * (Math.PI / 4) * Math.pow(stirrupBarDia, 2); 
    stirrupSpacing = (asv * 0.87 * fy) / (0.4 * b);
    stirrupSpacing = Math.min(stirrupSpacing, 0.75 * d, 300);
  } else {
    shearReinforcementRequired = true;
    const Vus = (Vu * 1000) - (tc * b * d); 
    const asv = 2 * (Math.PI / 4) * Math.pow(stirrupBarDia, 2); 
    stirrupSpacing = (0.87 * fy * asv * d) / Vus;
    stirrupSpacing = Math.min(stirrupSpacing, 0.75 * d, 300);
  }
  
  // 4. Deflection Check
  const deflection = checkDeflection(inputs.beamClearSpan, d, astRequired, astProvided, b, fy);

  return {
    muLim: MuLim,
    isDoublyReinforced,
    astRequired,
    ptProvided,
    numberOfBars,
    astProvided,
    tauV: parseFloat(tv.toFixed(2)),
    tauC: tc,
    shearReinforcementRequired,
    stirrupSpacing: Math.floor(stirrupSpacing),
    ...deflection
  };
};