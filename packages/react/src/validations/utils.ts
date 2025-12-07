import { ValidationError, ValidationResponse } from "../field";

export function isError(result: ValidationResponse): result is ValidationError {
  return result !== true;
}

export function isMultiError(result: ValidationResponse | ValidationResponse[]): result is ValidationResponse[] {
  return Array.isArray(result);
}
