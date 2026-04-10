import React from "react";
import type { BudgetAlert } from "../types";
import { CATEGORY_ICONS, CATEGORY_LABELS, formatCurrency } from "../utils/helpers";
import styles from './../styles/BudgetAlerts.module.css'

interface BudgetAlertsProps {
  alerts: BudgetAlert[];
}

export const BudgetAlerts: React.FC<BudgetAlertsProps> = ({ alerts }) => {
  if (!alerts.length) return null;

  return (
    <div className={styles.list}>
      {alerts.map(({ category, limit, spent, percentage, isExceeded }) => (
        <div key={category} className={styles.row}>
          <div className={styles.header}>
            <span className={styles.label}>
              {CATEGORY_ICONS[category]} {CATEGORY_LABELS[category]}
            </span>
            <span
            className={styles.badge}
              style={{
                background: isExceeded ? "#FAECE7" : "#FAEEDA",
                color: isExceeded ? "#4A1B0C" : "#633806",
              }}
            >
              {isExceeded ? "Excedido" : "En riesgo"} {percentage.toFixed(0)}%
            </span>
          </div>
          <div className={styles.track}>
            <div
            className={styles.bar}
              style={{
                width: `${Math.min(percentage, 100)}%`,
                background: isExceeded ? "#D85A30" : "#BA7517",
              }}
            />
          </div>
          <div className={styles.amounts}>
            <span>{formatCurrency(spent)} gastado</span>
            <span>Límite {formatCurrency(limit)}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

