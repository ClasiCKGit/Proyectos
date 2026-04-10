import React from "react";
import type { MonthlyStats } from "../types";
import { formatCurrency } from "../utils/helpers";
import styles from './../styles/MonthlyBarChart.module.css'

interface MonthlyBarChartProps {
  data: MonthlyStats[];
}

export const MonthlyBarChart: React.FC<MonthlyBarChartProps> = ({ data }) => {
  const maxVal = Math.max(
    ...data.flatMap((d) => [d.totalIncome, d.totalExpenses]),
    1
  );

  const getMonthLabel = (year: number, month: number): string => {
    return new Date(year, month - 1, 1).toLocaleDateString("es-AR", {
      month: "short",
    });
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.chart}>
        {data.map((d, i) => (
          <div key={i} className={styles.group}>
            <div className={styles.bars}>
              {/* Income bar */}
              <div className={styles.barWrapper} title={`Ingresos: ${formatCurrency(d.totalIncome)}`}>
                <div
                  className={styles.bar}
                  style={{
                    height: `${Math.round((d.totalIncome / maxVal) * 100)}%`,
                    background: "#1D9E75",
                  }}
                />
              </div>
              {/* Expense bar */}
              <div className={styles.barWrapper} title={`Gastos: ${formatCurrency(d.totalExpenses)}`}>
                <div
                  className={styles.bar}
                  style={{
                    height: `${Math.round((d.totalExpenses / maxVal) * 100)}%`,
                    background: "#D85A30",
                  }}
                />
              </div>
            </div>
            <div className={styles.monthLabel}>
              {getMonthLabel(d.year, d.month)}
            </div>
          </div>
        ))}
      </div>
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={styles.dot} style={{ background: "#1D9E75" }} />
          Ingresos
        </span>
        <span className={styles.legendItem}>
          <span className={styles.dot} style={{ background: "#D85A30" }} />
          Gastos
        </span>
      </div>
    </div>
  );
};
