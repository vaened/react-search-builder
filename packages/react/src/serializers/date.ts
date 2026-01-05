import type { SynchronousSerializer } from "../field";
import { createSerializer } from "../serializers/resolve";

export const dateSerializer: SynchronousSerializer<Date> = {
  serialize(value: Date) {
    if (isNaN(value.getTime())) {
      return "";
    }

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  },

  unserialize(value: string) {
    if (!value) {
      return undefined;
    }

    const date = parse(value);

    if (date === null) {
      return undefined;
    }

    return isNaN(date.getTime()) ? undefined : date;
  },
};

export const createDateSerializer = () => createSerializer(dateSerializer);

function parse(value: string): Date | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const timestamp = Number(trimmed);

  if (!Number.isNaN(timestamp) && trimmed.length >= 10) {
    const milliseconds = trimmed.length <= 10 ? timestamp * 1000 : timestamp;
    return new Date(milliseconds);
  }

  if (trimmed.length === 10 && trimmed[4] === "-" && trimmed[7] === "-") {
    const year = Number(trimmed.slice(0, 4));
    const month = Number(trimmed.slice(5, 7));
    const day = Number(trimmed.slice(8, 10));

    return new Date(year, month - 1, day);
  }

  return new Date(trimmed);
}
