import { GoogleGenAI } from "@google/genai";
import { DesignInputs, LoadResult, AnalysisResult, DesignResult } from '../types';

export const generateDesignReport = async (
  inputs: DesignInputs,
  loads: LoadResult,
  analysis: AnalysisResult,
  design: DesignResult
): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API Key not found");

    const ai = new GoogleGenAI({ apiKey });
    
    // Helper to describe slab config
    const describeSlab = (side: string, config: typeof inputs.leftSlab) => {
      if (!config.enabled) return `${side} Side: No Slab`;
      if (config.type === 'OneWay') return `${side} Side: One-Way Slab (Span Lx=${config.lx}m) - Load ${loads.udlFromLeftSlab.toFixed(2)} kN/m`;
      return `${side} Side: Two-Way Slab (Lx=${config.lx}m, Ly=${config.ly}m) supported on ${config.supportEdge} Edge (${config.supportEdge === 'Short' ? 'Triangular' : 'Trapezoidal'} Load)`;
    };

    const pointLoadsDesc = inputs.pointLoads.length > 0 
      ? inputs.pointLoads.map(p => `${p.value}kN at ${p.distance}m`).join(', ')
      : "None";

    const context = `
    You are a Senior Structural Engineer. Review the following Reinforced Concrete Beam design.
    
    **Input Parameters:**
    - Beam Clear Span: ${inputs.beamClearSpan}m
    - Beam Size: ${inputs.beamWidth}mm x ${inputs.beamDepth}mm
    - Slab Config:
      - ${describeSlab('Left', inputs.leftSlab)}
      - ${describeSlab('Right', inputs.rightSlab)}
    - Point Loads: ${pointLoadsDesc}
    - Slab Loads: Thickness=${inputs.slabThickness}mm, Live=${inputs.liveLoad}kN/m2, Finish=${inputs.floorFinish}kN/m2
    - Wall Load: Height=${inputs.wallHeight}m, Thick=${inputs.wallThickness}mm, Density=${inputs.masonryDensity}kN/m3
    - Materials: Concrete M${inputs.fck}, Steel Fe${inputs.fy}
    
    **Calculated Results:**
    - Total Design UDL: ${loads.totalDesignUDL.toFixed(2)} kN/m (Factored)
    - Max Moment (Mu): ${analysis.maxMoment.toFixed(2)} kNm
    - Max Shear (Vu): ${analysis.maxShear.toFixed(2)} kN
    - Limiting Moment (Mu,lim): ${design.muLim.toFixed(2)} kNm
    - Status: ${design.isDoublyReinforced ? 'OVER-REINFORCED / DOUBLY REQUIRED' : 'Singly Reinforced'}
    - Required Ast: ${design.astRequired.toFixed(0)} mm2
    - Provided: ${design.numberOfBars} bars of ${inputs.mainBarDia}mm dia (Total ${design.astProvided.toFixed(0)} mm2)
    - Shear Stress (Tv): ${design.tauV} N/mm2
    - Concrete Shear Capacity (Tc): ${design.tauC} N/mm2
    - Stirrups: 2-legged ${inputs.stirrupBarDia}mm @ ${design.stirrupSpacing}mm c/c
    
    **Task:**
    1. Provide a professional summary of the design adequacy.
    2. Explicitly mention how the load transfer (Triangular/Trapezoidal/One-way) AND point loads affect the design.
    3. If the beam is Over-Reinforced, strongly suggest increasing depth or width.
    4. Comment on the shear capacity and stirrup spacing.
    5. Provide 3-4 bullet points on detailing (anchorage length, lap length, cover).
    6. Format with clear Markdown headings.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: context,
      config: {
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });

    return response.text || "Could not generate report.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating AI report. Please check your API key and connection.";
  }
};