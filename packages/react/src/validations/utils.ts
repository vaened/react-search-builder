import { ValidationResponse } from "../field";

export function isError(result: ValidationResponse): boolean {
  if (result === false) {
    return true;
  }

  if (typeof result === "object" && !result.value) {
    return true;
  }

  return false;
}

export function isMultiError(result: ValidationResponse | ValidationResponse[]): result is ValidationResponse[] {
  return Array.isArray(result);
}
