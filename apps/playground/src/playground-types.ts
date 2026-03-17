export type SearchIndex = "person" | "account";
export type SearchFlag = "onlyActive" | "withDebt" | "withoutEmail" | "vipOnly";
export type PersonStatus = "active" | "pending" | "suspended";
export type PersonCountry = "Peru" | "Colombia" | "Chile" | "Mexico";

export type PersonRecord = {
  id: number;
  uuid: string;
  fullName: string;
  documentId: string;
  accountNumber: string;
  email: string | null;
  country: PersonCountry;
  city: string;
  status: PersonStatus;
  hasDebt: boolean;
  vip: boolean;
  registeredAt: string;
  lastPaymentDate: string | null;
  balance: number;
};

export type SearchResultState = {
  items: PersonRecord[];
  total: number;
  totalPages: number;
  currentPage: number;
  queryString: string;
  activeCount: number;
  debtCount: number;
  vipCount: number;
};
