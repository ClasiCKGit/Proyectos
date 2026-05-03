import { useState } from "react";
import { useExpenses } from "../hooks/useExpenses";
import type { Category, Budget } from "../types";
import { formatMonthYear, formatCurrency } from "../utils/helpers";
import { CATEGORY_ICONS, CATEGORY_LABELS } from "../utils/helpers";
import { CategorySelect } from "./ui/CategorySelect";
import styles from '../styles/Budgets&SavingGoals.module.css'

export const BudgetsView: React.FC<{
    stats: ReturnType<typeof useExpenses>["stats"];
    budgets: Budget[];
    upsert: (data: Omit<Budget, "id" | "createdAt">) => Promise<any>;
    remove: (id: string | undefined) => Promise<void>;
}> = ({ stats, budgets, upsert, remove }) => {
    const [open, setOpen] = useState<boolean>(false)
    const [category, setCategory] = useState<Category>("food");
    const [limit, setLimit] = useState("");

    const now = new Date();
    const cats = stats.currentMonth.byCategory;

    const handleAdd = () => {
        const limitNum = parseFloat(limit);
        if (!category || !limitNum || limitNum <= 0) return;
        upsert({ category, limit: limitNum, period: "monthly" });
        setLimit("");
    };

    return (
        <div className={styles.content}>
            <h2 className={styles.heading}>Presupuestos</h2>

            <div className={styles.card}>
                <p className={styles.cardTitle}>
                    {formatMonthYear(now.getFullYear(), now.getMonth() + 1)}
                </p>
                {budgets.length === 0 && (
                    <p
                        style={{
                            color: "var(--color-text-secondary)",
                            fontSize: 14,
                        }}
                    >
                        Sin presupuestos configurados.
                    </p>
                )}
                {budgets.map((b) => {
                    const spent = cats[b.category] ?? 0;
                    const pct = b.limit > 0 ? (spent / b.limit) * 100 : 0;
                    return (
                        <div key={b.id} className={styles.budgetRow}>
                            <div className={styles.budgetHeader}>
                                <span className={styles.budgetTitle}>
                                    {CATEGORY_ICONS[b.category]}{" "}
                                    {CATEGORY_LABELS[b.category]}
                                </span>
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 8,
                                        alignItems: "center",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: 13,
                                            color: "var(--color-text-secondary)",
                                        }}
                                    >
                                        {formatCurrency(spent)} /{" "}
                                        {formatCurrency(b.limit)}
                                    </span>
                                    <button
                                        className={styles.removeBtn}
                                        onClick={() => remove(b.id)}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                            <div className={styles.track}>
                                <div
                                    className={styles.bar}
                                    style={{
                                        width: `${Math.min(pct, 100)}%`,
                                        background:
                                            pct >= 100
                                                ? "#D85A30"
                                                : pct >= 80
                                                  ? "#BA7517"
                                                  : "#1D9E75",
                                    }}
                                />
                            </div>
                            <span
                                style={{
                                    fontSize: 11,
                                    color: "var(--color-text-secondary)",
                                }}
                            >
                                {pct.toFixed(0)}% utilizado
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className={styles.card}>
                <p className={styles.cardTitle}>Agregar presupuesto</p>
                <div className={styles.addBudgetRow}>
                    <div className={styles.grid} style={{ flex: 1}}>
                        <div className={styles.field}>
                            <CategorySelect
                                category={category}
                                open={open}
                                setOpen={setOpen}
                                setCategory={setCategory}
                            />
                        </div>
                        <div className={styles.field} style={{ gridColumn: "span 2" }}>
                            <input
                                className={styles.input}
                                type="number"
                                placeholder="Límite mensual"
                                value={limit}
                                onChange={(e) => setLimit(e.target.value)}
                                min="0"
                            />
                        </div>
                    </div>
                    <button className={styles.btnPrimary} onClick={handleAdd}>
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    );
};
