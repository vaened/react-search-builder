import type { PrimitiveFilterDictionary } from "../field";

export function readDictionaryFromSearch(search: string): PrimitiveFilterDictionary {
  const params = new URLSearchParams(search);
  const keys = new Set(params.keys());
  const values: PrimitiveFilterDictionary = {};

  keys.forEach((key) => {
    if (isArrayParameter(key)) {
      values[convertToScalarParameter(key)] = params.getAll(key);
      return;
    }

    values[key] = params.get(key) as string;
  });

  return values;
}

export function createSearchParams(
  values: PrimitiveFilterDictionary,
  currentSearch: string,
  whitelist?: string[]
): URLSearchParams {
  const currentParams = new URLSearchParams(currentSearch);
  const nextParams = new URLSearchParams();

  if (whitelist) {
    currentParams.forEach((value, key) => {
      if (!whitelist.includes(normalizeParameter(key))) {
        nextParams.append(key, value);
      }
    });
  }

  Object.entries(values).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      const uniqueValues = [...new Set(value)].sort();

      uniqueValues.forEach((item) => {
        if (isValidValue(item)) {
          nextParams.append(convertToArrayParameter(key), String(item));
        }
      });

      return;
    }

    if (isValidValue(value)) {
      nextParams.append(key, String(value));
    }
  });

  return nextParams;
}

export function normalizeParameter(parameter: string): string {
  return isArrayParameter(parameter) ? convertToScalarParameter(parameter) : parameter;
}

function convertToScalarParameter(parameter: string): string {
  return parameter.slice(0, -2);
}

function convertToArrayParameter(parameter: string): string {
  return `${parameter}[]`;
}

function isArrayParameter(parameter: string): boolean {
  return parameter.endsWith("[]");
}

function isValidValue(value: unknown) {
  return value !== undefined && value !== null;
}
