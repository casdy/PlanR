/**
 * @file src/utils/calculations.ts
 * @description Utility functions for fitness-related calculations.
 */

interface NavyBodyFatInput {
  sex: 'male' | 'female';
  waist: number;     // cm
  neck: number;      // cm
  height: number;    // cm
  hip?: number;      // cm (required for females)
}

/**
 * Calculates estimated body fat percentage using the US Navy Method.
 * Measurements must be in centimeters.
 * 
 * Formulas:
 * Men: 495 / (1.0324 - 0.19077 * log10(waist - neck) + 0.15456 * log10(height)) - 450
 * Women: 495 / (1.29579 - 0.35004 * log10(waist + hip - neck) + 0.22100 * log10(height)) - 450
 */
export function calculateNavyBodyFat(input: NavyBodyFatInput): number {
  const { sex, waist, neck, height, hip } = input;

  if (sex === 'male') {
    const densityMen = 1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height);
    const bf = 495 / densityMen - 450;
    return parseFloat(bf.toFixed(1));
  } else {
    if (hip === undefined) {
      throw new Error("Hip measurement is required for females in US Navy formula.");
    }
    const densityWomen = 1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(height);
    const bf = 495 / densityWomen - 450;
    return parseFloat(bf.toFixed(1));
  }
}
