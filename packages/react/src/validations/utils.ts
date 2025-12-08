import { FilterValue, ValidationError, ValidationResponse } from "../field";
import { NonUndefined } from "../internal";

export function isError(result: ValidationResponse): result is ValidationError {
  return result !== true;
}

export function isMultiError<TResponse extends ValidationResponse>(result: TResponse | TResponse[]): result is TResponse[] {
  return Array.isArray(result);
}

export function isValidValue<TValue extends FilterValue>(result: TValue): result is NonUndefined<NonNullable<TValue>> {
  return result !== undefined && result !== null;
}
