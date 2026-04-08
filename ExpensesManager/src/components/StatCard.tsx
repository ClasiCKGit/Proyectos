import React from "react";
import styles from './../styles/StatCard.module.css'

interface StatCardProps {
  label: string;
  value: string;
  change?: number; // porcentaje vs mes anterior
  variant?: "default" | "positive" | "negative";
  icon?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  change,
  variant = "default",
  icon,
}) => {
  const valueColor =
    variant === "positive"
      ? "#1D9E75"
      : variant === "negative"
      ? "#D85A30"
      : "var(--color-text-primary)";

  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <span className={styles.label}>{label}</span>
        {icon && <span className={styles.icon}>{icon}</span>}
      </div>
      <div className={styles.value} style={{ color: valueColor }}>{value}</div>
      {change !== undefined && (
        <div
          className={styles.change}
          style={{
            color: change >= 0 ? "#D85A30" : "#1D9E75",
          }}
        >
          {change >= 0 ? "▲" : "▼"} {Math.abs(change).toFixed(1)}% vs mes
          anterior
        </div>
      )}
    </div>
  );
};
