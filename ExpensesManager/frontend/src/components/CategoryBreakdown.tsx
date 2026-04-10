import React from "react";
import type { Category } from "../types";
import { CATEGORY_ICONS, CATEGORY_LABELS, CATEGORY_COLORS, formatCurrency } from "../utils/helpers";
import styles from './../styles/CategoryBreakdown.module.css'

interface CategoryBreakdownProps {
  data: Array<{ category: Category; amount: number; percentage: number }>;
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ data }) => {
  if (!data.length || data.every((d) => d.amount === 0)) {
    return (
      <div className={styles.empty}>Sin gastos este mes</div>
    );
  }

  const visible = data.filter((d) => d.amount > 0);

  return (
    <div className={styles.list}>
      {visible.map(({ category, amount, percentage }) => (
        <div key={category} className={styles.row}>
          <div className={styles.labelGroup}>
            <span className={styles.emoji}>{CATEGORY_ICONS[category]}</span>
            <span className={styles.name}>{CATEGORY_LABELS[category]}</span>
          </div>
          <div className={styles.track}>
            <div
              className={styles.fill}
              style={{
                width: `${Math.min(percentage, 100)}%`,
                background: CATEGORY_COLORS[category],
              }}
            />
          </div>
          <div className={styles.values}>
            <span className={styles.amount}>{formatCurrency(amount)}</span>
            <span className={styles.pct}>{percentage.toFixed(0)}%</span>
          </div>
        </div>
      ))}
    </div>
  );
};

