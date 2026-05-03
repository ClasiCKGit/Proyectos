import React, { useState } from "react";
import type { Transaction, Budget } from "../types";
import { useExpenses } from "../hooks/useExpenses";
import { StatCard } from "./StatCard";
import { MonthlyBarChart } from "./MonthlyBarChart";
import { CategoryBreakdown } from "./CategoryBreakdown";
import { TransactionList } from "./TransactionList";
import { TransactionForm } from "./TransactionForm";
import { BudgetAlerts } from "./BudgetAlerts";
import { formatCurrency, formatMonthYear } from "../utils/helpers";
import styles from "./../styles/Dashboard.module.css";
import { useRecurring } from "../hooks/useRecurring";
import { RecurringTab, RecurringNotificationBanner } from "./RecurringTab";

type Tab =
    | "dashboard"
    | "transactions"
    | "add"
    | "budgets"
    | "goals"
    | "recurring";

export const Dashboard: React.FC = () => {
    const {
        transactions,
        stats,
        savingsGoals,
        budgets,
        addTransaction,
        editTransaction,
        removeTransaction,
        upsertSavingsGoal,
        contributeSavingsGoal,
        removeSavingsGoal,
        upsertBudget,
        removeBudget,
    } = useExpenses();
    const {
        items: recurringItems,
        upcoming,
        newlyGenerated,
        addRecurring,
        editRecurring,
        toggleRecurring,
        removeRecurring,
        dismissNotifications,
    } = useRecurring();

    const [tab, setTab] = useState<Tab>("dashboard");
    const [editingTx, setEditingTx] = useState<Transaction | undefined>();

    const now = new Date();

    const handleEdit = (tx: Transaction) => {
        setEditingTx(tx);
        setTab("add");
    };

    const handleSubmit = (
        data: Omit<Transaction, "id" | "createdAt" | "updatedAt">,
    ) => {
        if (editingTx) {
            editTransaction(editingTx.id, data);
            setEditingTx(undefined);
        } else {
            addTransaction(data);
        }
        setTab("transactions");
    };

    const handleDelete = (id: string) => {
        removeTransaction(id);
        setEditingTx(undefined);
        setTab("transactions");
    };

    const handleCancel = () => {
        setEditingTx(undefined);
        setTab(editingTx ? "transactions" : "dashboard");
    };

    return (
        <div className={styles.dashboard}>
            {/* NAV */}
            <nav className={styles.nav}>
                {(
                    [
                        { id: "dashboard", label: "Resumen" },
                        { id: "transactions", label: "Movimientos" },
                        { id: "add", label: "+ Nueva" },
                        { id: "budgets", label: "Presupuestos" },
                        { id: "goals", label: "Metas de ahorro" },
                        { id: "recurring", label: "Recurrentes" },
                    ] as { id: Tab; label: string }[]
                ).map(({ id, label }) => (
                    <button
                        key={id}
                        className={
                            tab === id
                                ? `${styles.navBtn} ${styles.navBtnActive}`
                                : styles.navBtn
                        }
                        onClick={() => {
                            if (id !== "add") setEditingTx(undefined);
                            setTab(id);
                        }}
                    >
                        {label}
                    </button>
                ))}
            </nav>

            {/* ── DASHBOARD ───────────────────────────────────────────────────────── */}
            {tab === "dashboard" && (
                <div className={styles.content}>
                    <div className={styles.headingContainer}>
                        <RecurringNotificationBanner
                            generated={newlyGenerated}
                            onDismiss={dismissNotifications}
                        />
                        <h2 className={styles.heading}>
                            {formatMonthYear(
                                now.getFullYear(),
                                now.getMonth() + 1,
                            ).replace(/^./, (c) => c.toUpperCase())}
                        </h2>
                    </div>

                    {/* Stats row */}
                    <div className={styles.statsGrid}>
                        <StatCard
                            label="Balance"
                            value={formatCurrency(stats.currentMonth.balance)}
                            variant={
                                stats.currentMonth.balance >= 0
                                    ? "positive"
                                    : "negative"
                            }
                            icon="💳"
                        />
                        <StatCard
                            label="Ingresos"
                            value={formatCurrency(
                                stats.currentMonth.totalIncome,
                            )}
                            variant="positive"
                            icon="💵"
                        />
                        <StatCard
                            label="Gastos"
                            value={formatCurrency(
                                stats.currentMonth.totalExpenses,
                            )}
                            change={stats.monthOverMonth.expenses}
                            icon="🧾"
                        />
                        <StatCard
                            label="Tasa de ahorro"
                            value={`${stats.savingsRate.toFixed(1)}%`}
                            variant={
                                stats.savingsRate >= 20
                                    ? "positive"
                                    : stats.savingsRate < 0
                                      ? "negative"
                                      : "default"
                            }
                            icon="🏦"
                        />
                    </div>

                    {/* Monthly chart */}
                    <div className={styles.card}>
                        <p className={styles.cardTitle}>Últimos 6 meses</p>
                        <MonthlyBarChart data={stats.last12Months.slice(-6)} />
                    </div>

                    {/* Category breakdown */}
                    <div className={styles.card}>
                        <p className={styles.cardTitle}>Gastos por categoría</p>
                        <CategoryBreakdown data={stats.topCategories} />
                    </div>

                    {/* Budget alerts */}
                    {stats.budgetAlerts.length > 0 && (
                        <div className={styles.card}>
                            <p className={styles.cardTitle}>
                                ⚠️ Alertas de presupuesto
                            </p>
                            <BudgetAlerts alerts={stats.budgetAlerts} />
                        </div>
                    )}

                    {/* Recent transactions */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <p className={styles.cardTitle}>
                                Últimos movimientos
                            </p>
                            <button
                                className={styles.linkBtn}
                                onClick={() => setTab("transactions")}
                            >
                                Ver todos →
                            </button>
                        </div>
                        <TransactionList
                            transactions={transactions}
                            onEdit={handleEdit}
                            preview={5}
                        />
                    </div>
                </div>
            )}

            {/* ── TRANSACTIONS ────────────────────────────────────────────────────── */}
            {tab === "transactions" && (
                <div className={styles.content}>
                    <h2 className={styles.heading}>Movimientos</h2>
                    <div className={styles.card}>
                        <TransactionList
                            transactions={transactions}
                            onEdit={handleEdit}
                        />
                    </div>
                </div>
            )}

            {/* ── ADD / EDIT ───────────────────────────────────────────────────────── */}
            {tab === "add" && (
                <div className={styles.content}>
                    <h2 className={styles.heading}>
                        {editingTx ? "Editar movimiento" : "Nueva transacción"}
                    </h2>
                    <div className={styles.card}>
                        <TransactionForm
                            initial={editingTx}
                            onSubmit={handleSubmit}
                            onDelete={handleDelete}
                            onCancel={handleCancel}
                        />
                    </div>
                </div>
            )}

            {/* ── BUDGETS ──────────────────────────────────────────────────────────── */}
            {tab === "budgets" && (
                <BudgetsView
                    stats={stats}
                    budgets={budgets}
                    upsert={upsertBudget}
                    remove={removeBudget}
                />
            )}

            {/* ── SAVING GOALS ─────────────────────────────────────────────────────── */}
            {tab === "goals" && (
                <SavingGoalsView
                    addTransaction={addTransaction}
                    upsert={upsertSavingsGoal}
                    contribute={contributeSavingsGoal}
                    remove={removeSavingsGoal}
                    savingsGoals={savingsGoals}
                />
            )}

            {/* ── RECURRENT TRANSACTIONS ───────────────────────────────────────────── */}
            {tab === "recurring" && (
                <div className={styles.content}>
                    <h2 className={styles.heading}>
                        Transacciones recurrentes
                    </h2>
                    <RecurringTab
                        items={recurringItems}
                        upcoming={upcoming}
                        newlyGenerated={newlyGenerated}
                        onAdd={addRecurring}
                        onEdit={editRecurring}
                        onToggle={toggleRecurring}
                        onDelete={removeRecurring}
                        onDismissNotifications={dismissNotifications}
                    />
                </div>
            )}
        </div>
    );
};

// ─── BUDGETS SUBVIEW ──────────────────────────────────────────────────────────

import type { Category } from "../types";
import { CATEGORY_ICONS, CATEGORY_LABELS } from "../utils/helpers";
import { CategorySelect } from "./ui/CategorySelect";
import { SavingGoalsView } from "./SavingGoals";

const BudgetsView: React.FC<{
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
                        <div className={styles.field}                                 style={{ gridColumn: "span 2" }}>
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
