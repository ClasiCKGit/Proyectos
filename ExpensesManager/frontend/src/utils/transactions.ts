import { v4 as uuidv4 } from "uuid";
import type {
  Transaction,
  FilterOptions,
  SortOptions,
  PaginationOptions,
  PaginatedResult,
} from "../types";

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export function createTransaction(
  params: Omit<Transaction, "id" | "createdAt" | "updatedAt">
): Transaction {
  const now = new Date().toISOString();
  return {
    ...params,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
  };
}

export function updateTransaction(
  transaction: Transaction,
  updates: Partial<Omit<Transaction, "id" | "createdAt">>
): Transaction {
  return {
    ...transaction,
    ...updates,
    id: transaction.id,
    createdAt: transaction.createdAt,
    updatedAt: new Date().toISOString(),
  };
}

export function deleteTransaction(
  transactions: Transaction[],
  id: string
): Transaction[] {
  return transactions.filter((t) => t.id !== id);
}

export function getTransactionById(
  transactions: Transaction[],
  id: string
): Transaction | undefined {
  return transactions.find((t) => t.id === id);
}

// ─── FILTERING ────────────────────────────────────────────────────────────────

export function filterTransactions(
  transactions: Transaction[],
  filters: FilterOptions
): Transaction[] {
  return transactions.filter((t) => {
    if (filters.type && t.type !== filters.type) return false;

    if (filters.category && t.category !== filters.category) return false;

    if (filters.dateFrom && t.date < filters.dateFrom) return false;

    if (filters.dateTo && t.date > filters.dateTo) return false;

    if (filters.amountMin !== undefined && t.amount < filters.amountMin)
      return false;

    if (filters.amountMax !== undefined && t.amount > filters.amountMax)
      return false;

    if (filters.tags && filters.tags.length > 0) {
      const hasAllTags = filters.tags.every((tag) => t.tags.includes(tag));
      if (!hasAllTags) return false;
    }

    if (filters.search) {
      const query = filters.search.toLowerCase();
      const matchesDescription = t.description.toLowerCase().includes(query);
      const matchesNotes = t.notes?.toLowerCase().includes(query) ?? false;
      const matchesTags = t.tags.some((tag) => tag.toLowerCase().includes(query));
      if (!matchesDescription && !matchesNotes && !matchesTags) return false;
    }

    return true;
  });
}

// ─── SORTING ──────────────────────────────────────────────────────────────────

export function sortTransactions(
  transactions: Transaction[],
  sort: SortOptions
): Transaction[] {
  return [...transactions].sort((a, b) => {
    let comparison = 0;

    switch (sort.field) {
      case "date":
        comparison = a.date.localeCompare(b.date);
        break;
      case "amount":
        comparison = a.amount - b.amount;
        break;
      case "description":
        comparison = a.description.localeCompare(b.description);
        break;
      case "category":
        comparison = a.category.localeCompare(b.category);
        break;
    }

    return sort.direction === "asc" ? comparison : -comparison;
  });
}

// ─── PAGINATION ───────────────────────────────────────────────────────────────

export function paginateTransactions(
  transactions: Transaction[],
  options: PaginationOptions
): PaginatedResult<Transaction> {
  const { page, pageSize } = options;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return {
    data: transactions.slice(start, end),
    total: transactions.length,
    page,
    pageSize,
    totalPages: Math.ceil(transactions.length / pageSize),
  };
}

// ─── RECURRENCE ───────────────────────────────────────────────────────────────

export function generateRecurringTransactions(
  source: Transaction,
  upToDate: string
): Transaction[] {
  if (source.recurrence === "none") return [];

  const result: Transaction[] = [];
  const start = new Date(source.date);
  const end = new Date(upToDate);
  let current = new Date(start);

  const advance = (date: Date): Date => {
    const next = new Date(date);
    switch (source.recurrence) {
      case "daily":
        next.setDate(next.getDate() + 1);
        break;
      case "weekly":
        next.setDate(next.getDate() + 7);
        break;
      case "monthly":
        next.setMonth(next.getMonth() + 1);
        break;
      case "yearly":
        next.setFullYear(next.getFullYear() + 1);
        break;
    }
    return next;
  };

  current = advance(current); // skip original

  while (current <= end) {
    result.push(
      createTransaction({
        ...source,
        date: current.toISOString().split("T")[0],
        recurrence: "none", // clones are non-recurring
      })
    );
    current = advance(current);
  }

  return result;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

export function getTransactionsByMonth(
  transactions: Transaction[],
  year: number,
  month: number // 1-12
): Transaction[] {
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  return transactions.filter((t) => t.date.startsWith(prefix));
}

export function getTransactionsByDateRange(
  transactions: Transaction[],
  from: string,
  to: string
): Transaction[] {
  return transactions.filter((t) => t.date >= from && t.date <= to);
}

export function getAllTags(transactions: Transaction[]): string[] {
  const tagSet = new Set<string>();
  transactions.forEach((t) => t.tags.forEach((tag) => tagSet.add(tag)));
  return Array.from(tagSet).sort();
}
