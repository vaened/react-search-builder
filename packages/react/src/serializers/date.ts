/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import type { SynchronousSerializer } from "../field";
import { createSerializer } from "../serializers/resolve";

export const dateSerializer: SynchronousSerializer<Date> = {
  serialize(value: Date) {
    if (isNaN(value.getTime())) {
      return "";
    }

    const date = value.toISOString();
    return date.split("T")[0];
  },

  unserialize(value: string) {
    if (!value) {
      return undefined;
    }

    const date = parse(value);

    return isNaN(date.getTime()) ? undefined : date;
  },
};

export const createDateSerializer = () => createSerializer(dateSerializer);

function parse(value: string): Date {
  const trimmed = value.trim();
  const asNumber = Number(trimmed);

  if (!isNaN(asNumber)) {
    return new Date(asNumber);
  }

  if (value.length === 10) {
    return new Date(`${value}T00:00:00.000Z`);
  }

  if (value.includes("T") || value.endsWith("Z")) {
    return new Date(value);
  }

  return new Date(value);
}
