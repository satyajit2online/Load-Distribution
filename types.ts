export enum SteelGrade {
  Fe415 = 415,
  Fe500 = 500,
  Fe550 = 550,
}

export enum ConcreteGrade {
  M20 = 20,
  M25 = 25,
  M30 = 30,
  M35 = 35,
}

export type SlabType = 'OneWay' | 'TwoWay';
export type BeamSupportEdge = 'Short' | 'Long'; // For TwoWay: Short Edge -> Triangular Load, Long Edge -> Trapezoidal

export interface SlabSideConfig {
  enabled: boolean;
  type: SlabType;
  lx: number; // Short span of the slab panel
  ly: number; // Long span of the slab panel (Required for TwoWay)
  supportEdge: BeamSupportEdge; // Does this beam support the Short edge or Long edge of the slab?
}

export interface DesignInputs {
  // Slab Config
  slabThickness: number; // mm
  liveLoad: number; // kN/m2
  floorFinish: number; // kN/m2
  
  leftSlab: SlabSideConfig;
  rightSlab: SlabSideConfig;
  
  // Beam
  beamWidth: number; // mm
  beamDepth: number; // mm
  beamClearSpan: number; // m (Length of beam)
  effectiveCover: number; // mm
  
  // Wall
  wallHeight: number; // m
  wallThickness: number; // mm
  
  // Materials
  fck: ConcreteGrade;
  fy: SteelGrade;
  mainBarDia: number; // mm
  stirrupBarDia: number; // mm
}

export interface LoadResult {
  slabSelfWeight: number; // kN/m2
  totalSlabLoadArea: number; // kN/m2
  udlFromLeftSlab: number; // kN/m
  udlFromRightSlab: number; // kN/m
  udlTotalSlab: number; // kN/m
  beamSelfWeight: number; // kN/m
  wallLoad: number; // kN/m
  totalDesignUDL: number; // kN/m (Factored)
}

export interface AnalysisResult {
  maxMoment: number; // kNm
  maxShear: number; // kN
  effectiveDepth: number; // mm
}

export interface DesignResult {
  muLim: number; // kNm
  isDoublyReinforced: boolean;
  astRequired: number; // mm2
  ptProvided: number; // %
  numberOfBars: number;
  astProvided: number; // mm2
  
  tauV: number; // N/mm2
  tauC: number; // N/mm2
  shearReinforcementRequired: boolean;
  stirrupSpacing: number; // mm

  // Deflection Check
  actualLbyD: number;
  basicLbyD: number;
  modificationFactorKt: number;
  allowableLbyD: number;
  deflectionCheckPassed: boolean;
}