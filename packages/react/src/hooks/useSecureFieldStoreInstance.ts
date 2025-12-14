/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { useSearchBuilderQuietly } from "../contexts";
import { FieldStore } from "../store";

export type ErrorSolution = {
  title: string;
  content?: string;
};

export type ErrorBody = {
  title?: string;
  problem: string;
  solution: string | ErrorSolution;
};

export function useSecureFieldStoreInstance(source: FieldStore | undefined | null, message?: ErrorBody): FieldStore {
  const context = useSearchBuilderQuietly();

  const store = source ?? context?.store;

  if (!store) {
    validateStoreAvailabilityInComponent(store, message);
  }

  return store;
}

export function validateStoreAvailabilityInComponent(
  store: FieldStore | undefined | null,
  component?: ErrorBody
): asserts store is FieldStore {
  if (store) {
    return;
  }

  if (!component) {
    throw new Error(`This component requires a "store" to function, but none was found.`);
  }

  const solution: ErrorSolution = typeof component.solution === "string" ? { title: component.solution } : component.solution;
  const solutionSection = [`SOLUTION: ${solution.title}`, `${solution.content ?? ""}`];

  throw new Error(`
${component.title ?? "MISSING STORE CONFIGURATION"}
================================================================

PROBLEM: ${component.problem}

${solutionSection.join("\n")}
================================================================
  `);
}
