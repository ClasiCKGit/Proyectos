import React, { useState } from "react";
import type { Transaction } from "../types";
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  formatCurrency,
  formatRelativeDate,
} from "../utils/helpers";
import styles from './../styles/TransactionList.module.css'

interface TransactionListProps {
  transactions: Transaction[];
  onEdit?: (tx: Transaction) => void;
  /** If true, shows only the first N items without pagination */
  preview?: number;
}

// Lighter background versions for icon bubbles
const CAT_BG: Record<string, string> = {
  housing: "#EEEDFE", food: "#FAEEDA", transport: "#E6F1FB",
  health: "#E1F5EE", entertainment: "#FBEAF0", education: "#EEEDFE",
  clothing: "#FAECE7", savings: "#E1F5EE", other: "#F1EFE8",
};

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onEdit,
  preview,
}) => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  const filtered = transactions.filter((t) => {
    if (typeFilter !== "all" && t.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        t.description.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        (t.notes?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));
  const items = preview ? sorted.slice(0, preview) : sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);

  if (!transactions.length) {
    return <div className={styles.empty}>No hay transacciones aún</div>;
  }

  return (
    <div className={styles.wrapper}>
      {!preview && (
        <>
          <input
            className={styles.search}
            type="text"
            placeholder="Buscar..."
            name="search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <div className={styles.filters}>
            {(["all", "income", "expense"] as const).map((t) => (
              <button
                key={t}
                className={`${styles.chip} ${typeFilter === t ? styles.chipActive : ''}`}
                onClick={() => { setTypeFilter(t); setPage(1); }}
              >
                {t === "all" ? "Todos" : t === "income" ? "Ingresos" : "Gastos"}
              </button>
            ))}
          </div>
        </>
      )}

      <div className={styles.list}>
        {items.length === 0 ? (
          <div className={styles.empty}>Sin resultados</div>
        ) : (
          items.map((tx) => (
            <div
              key={tx.id}
              className={styles.item}
              onClick={() => onEdit?.(tx)}
              role={onEdit ? "button" : undefined}
            >
              <div
                className={styles.iconBubble}
                style={{
                  background: tx.type === "income" ? "#E1F5EE" : CAT_BG[tx.category],
                }}
              >
                <span style={{ fontSize: 15 }}>
                  {tx.type === "income" ? "💵" : CATEGORY_ICONS[tx.category]}
                </span>
              </div>
              <div className={styles.info}>
                <div className={styles.desc}>{tx.description}</div>
                <div className={styles.meta}>
                  {tx.type === "expense" ? CATEGORY_LABELS[tx.category] : "Ingreso"} ·{" "}
                  {formatRelativeDate(tx.date)}
                  {tx.tags.length > 0 && (
                    <span className={styles.tagRow}>
                      {tx.tags.map((tag) => (
                        <span key={tag} className={styles.tag}>{tag}</span>
                      ))}
                    </span>
                  )}
                </div>
              </div>
              <div
                className={styles.amount}
                style={{
                  color: tx.type === "income" ? "#1D9E75" : "#D85A30",
                }}
              >
                {tx.type === "income" ? "+" : "−"}
                {formatCurrency(tx.amount)}
              </div>
            </div>
          ))
        )}
      </div>

      {!preview && totalPages > 1 && (
        <div className={styles.pagination}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`${styles.chip} ${page === p ? styles.chipActive : ''}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

