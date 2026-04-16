export type Category =
  | "housing"
  | "food"
  | "transport"
  | "health"
  | "entertainment"
  | "education"
  | "clothing"
  | "savings"
  | "other";

export type RecurrenceType = "none" | "daily" | "weekly" | "monthly" | "yearly";

export type TransactionType = "expense" | "income";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  category: Category;
  date: string; // ISO 8601
  tags: string[];
  recurrence: RecurrenceType;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string | undefined;
  category: Category;
  limit: number;
  period: "monthly" | "yearly";
  createdAt: string;
}

export interface MonthlyStats {
  month: number;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  byCategory: Record<Category, number>;
  transactionCount: number;
}

export interface BudgetAlert {
  category: Category;
  limit: number;
  spent: number;
  percentage: number;
  isExceeded: boolean;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  createdAt: string;
}

export interface FilterOptions {
  type?: TransactionType;
  category?: Category;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  tags?: string[];
  search?: string;
}

export interface SortOptions {
  field: "date" | "amount" | "description" | "category";
  direction: "asc" | "desc";
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
