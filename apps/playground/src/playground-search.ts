import { FieldsCollection } from "@vaened/mui-search-builder";
import peopleData from "./data/people.json";
import { PAGE_SIZE } from "./playground-config";
import type { PersonCountry, PersonRecord, PersonStatus, SearchFlag, SearchIndex, SearchResultState } from "./playground-types";

export const people = peopleData as PersonRecord[];

export function createDefaultResultState(): SearchResultState {
  return evaluatePeopleSearch({
    collection: FieldsCollection.empty(),
    source: people,
  });
}

export function evaluatePeopleSearch({
  collection,
  source,
}: {
  collection: FieldsCollection;
  source: PersonRecord[];
}): SearchResultState {
  const values = collection.toValues();
  const query = normalizeQuery(values.q);
  const index = normalizeIndex(values.index);
  const flags = Array.isArray(values.flags) ? (values.flags as SearchFlag[]) : [];
  const country = typeof values.country === "string" && values.country.length > 0 ? (values.country as PersonCountry) : null;
  const status = typeof values.status === "string" && values.status.length > 0 ? (values.status as PersonStatus) : null;
  const page = typeof values.page === "number" && values.page > 0 ? values.page : 1;
  const registeredFrom = values.registeredFrom instanceof Date ? values.registeredFrom : null;
  const registeredTo = values.registeredTo instanceof Date ? values.registeredTo : null;
  const lastPaymentDate = values.lastPaymentDate instanceof Date ? values.lastPaymentDate : null;

  const filtered = source.filter((person) => {
    if (!matchesSearchIndex(person, query, index)) {
      return false;
    }

    if (country && person.country !== country) {
      return false;
    }

    if (status && person.status !== status) {
      return false;
    }

    if (!matchesFlags(person, flags)) {
      return false;
    }

    if (!matchesDateRange(person.registeredAt, registeredFrom, registeredTo)) {
      return false;
    }

    if (lastPaymentDate && normalizeDateKey(person.lastPaymentDate) !== normalizeDateKey(lastPaymentDate)) {
      return false;
    }

    return true;
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const items = filtered.slice(start, start + PAGE_SIZE);

  return {
    items,
    total,
    totalPages,
    currentPage,
    queryString: collection.toUrlSearchParams().toString(),
    activeCount: filtered.filter((person) => person.status === "active").length,
    debtCount: filtered.filter((person) => person.hasDebt).length,
    vipCount: filtered.filter((person) => person.vip).length,
  };
}

export function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}

function matchesSearchIndex(person: PersonRecord, query: string, index: SearchIndex) {
  if (!query) {
    return true;
  }

  const haystack =
    index === "account"
      ? [person.accountNumber, person.uuid]
      : [person.fullName, person.documentId, person.email ?? ""];

  return haystack.some((value) => value.toLowerCase().includes(query));
}

function matchesFlags(person: PersonRecord, flags: SearchFlag[]) {
  return flags.every((flag) => {
    switch (flag) {
      case "onlyActive":
        return person.status === "active";
      case "withDebt":
        return person.hasDebt;
      case "withoutEmail":
        return person.email === null;
      case "vipOnly":
        return person.vip;
      default:
        return true;
    }
  });
}

function matchesDateRange(value: string, start: Date | null, end: Date | null) {
  const current = normalizeDateKey(value);

  if (start && current < normalizeDateKey(start)) {
    return false;
  }

  if (end && current > normalizeDateKey(end)) {
    return false;
  }

  return true;
}

function normalizeIndex(value: unknown): SearchIndex {
  return value === "account" ? "account" : "person";
}

function normalizeQuery(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeDateKey(value: string | Date | null) {
  if (!value) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return value;
}
