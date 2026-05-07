import React, { useState } from "react";
import type { Transaction } from "../types";
import { useExpenses } from "../hooks/useExpenses";
import { StatCard } from "./StatCard";
import { MonthlyBarChart } from "./MonthlyBarChart";
import { CategoryBreakdown } from "./CategoryBreakdown";
import { TransactionList } from "./TransactionList";
import { TransactionForm } from "./TransactionForm";
import { BudgetAlerts } from "./BudgetAlerts";
import { BudgetsView } from "./BudgetsView";
import { SavingGoalsView } from "./SavingGoals";
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
        monthly,
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
                        monthly={monthly}
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
