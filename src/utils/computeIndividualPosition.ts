import { IndividualObject } from "../states/raw/individual/getIndividualObject";

/**
 * We support up to 10 individual positions:
 *
 * Bottom row (closest to main load, left → right): slots 0–4
 * Top row    (above main load,      left → right): slots 5–9
 *
 * Individuals are sorted (by power in calling code) and then mapped into these slots.
 * Any additional individuals beyond the first 10 are ignored for layout purposes.
 */

const filterUsedIndividuals = (individuals: IndividualObject[]): IndividualObject[] =>
  individuals.filter((i) => i?.has);

/**
 * Returns the individuals assigned to the bottom row (max 5).
 * These are typically the first 5 most significant individuals.
 */
export const getBottomRowIndividuals = (individuals: IndividualObject[]): IndividualObject[] =>
  filterUsedIndividuals(individuals).slice(0, 5);

/**
 * Returns the individuals assigned to the top row (next 5 after bottom row).
 */
export const getTopRowIndividuals = (individuals: IndividualObject[]): IndividualObject[] =>
  filterUsedIndividuals(individuals).slice(5, 10);

/**
 * Convenience helpers used by legacy code paths to check if there is at least
 * one individual in the top / bottom / right “half” of the layout.
 * With the new 10‑slot model these are approximations but kept for compatibility.
 */
export const checkHasBottomIndividual = (individuals: IndividualObject[]): boolean =>
  getBottomRowIndividuals(individuals).length > 0;

export const checkHasTopIndividual = (individuals: IndividualObject[]): boolean =>
  getTopRowIndividuals(individuals).length > 0;

export const checkHasRightIndividual = (individuals: IndividualObject[]): boolean => {
  const bottom = getBottomRowIndividuals(individuals);
  const top = getTopRowIndividuals(individuals);
  // Treat slots 3–4 (bottom) and 8–9 (top) as "right side"
  return bottom.slice(3).length > 0 || top.slice(3).length > 0;
};
