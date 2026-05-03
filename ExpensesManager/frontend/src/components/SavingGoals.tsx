import type React from "react";
import { useState } from "react";
import {
  formatMonthYear,
  formatCurrency,
  CATEGORY_ICONS,
} from "../utils/helpers";
import type { Transaction, SavingsGoal } from "../types";
import styles from "../styles/Budgets&SavingGoals.module.css";

export const SavingGoalsView: React.FC<{
  addTransaction: (
    data: Omit<Transaction, "id" | "createdAt" | "updatedAt">,
  ) => Promise<any>;
  upsert: (
    data: Omit<SavingsGoal, "id" | "createdAt"> & { id?: string },
  ) => Promise<any>;
  contribute: (id: string, amount: number) => Promise<any>;
  remove: (id: string) => Promise<void>;
  savingsGoals: SavingsGoal[];
}> = ({ addTransaction, upsert, contribute, remove, savingsGoals }) => {
  const emptySv: SavingsGoal = {
    id: "",
    name: "",
    currentAmount: 0,
    targetAmount: 0,
    deadline: "",
    createdAt: "",
  };

  const now = new Date();
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const defaultDeadline = nextWeek.toISOString().split("T")[0];

  const [deadline, setDeadline] = useState<string>(defaultDeadline);
  const [name, setName] = useState<string>("");
  const [targetAmount, setTargetAmount] = useState("");
  const [svSelected, setSvSelected] = useState<SavingsGoal>(emptySv);
  const [amount, setAmount] = useState("");

  const handleAdd = () => {
    const currentAmount = 0;
    const targetAmountNum = parseFloat(targetAmount);

    if (!deadline || !name || !targetAmount || targetAmountNum <= 0) {
      return;
    }
    const formatName = name[0].toUpperCase() + name.slice(1);
    upsert({
      name: formatName,
      currentAmount,
      targetAmount: targetAmountNum,
      deadline,
    });
    setName("");
    setTargetAmount("");
  };

  const handleContribute = () => {
    const amountNum = parseFloat(amount);
    const data: Omit<Transaction, "id" | "createdAt" | "updatedAt"> = {
      type: "expense",
      category: "savings",
      amount: amountNum,
      description: `Contribución a ${svSelected.name}`,
      date: now.toISOString().split("T")[0],
      tags: ["Contribucion", `${svSelected.name}`],
      notes: "",
      recurrence: "none",
      savingsGoalId: svSelected.id,
    };
    contribute(svSelected.id, amountNum);
    addTransaction(data);
    setSvSelected(emptySv);
    setAmount("");
  };

  const handleDelete = async (svId: string) => {
    await remove(svId);
    setSvSelected(emptySv);
  };

  return (
    <div className={styles.content}>
      <h2 className={styles.heading}>Metas de ahorro</h2>

      <div className={styles.card}>
        <p className={styles.cardTitle}>
          {formatMonthYear(now.getFullYear(), now.getMonth() + 1)}
        </p>
        {savingsGoals.length === 0 && (
          <p
            style={{
              color: "var(--color-text-secondary)",
              fontSize: 14,
            }}
          >
            Sin metas de ahorro configuradas.
          </p>
        )}
        {savingsGoals.map((s) => {
          const pct =
            s.currentAmount > 0 ? (s.currentAmount / s.targetAmount) * 100 : 0;
          return (
            <div key={s.id} className={styles.budgetRow}>
              <div className={styles.budgetHeader}>
                <span className={styles.budgetTitle}>
                  {CATEGORY_ICONS["savings"]} {s.name}
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
                    {formatCurrency(s.currentAmount)} /{" "}
                    {formatCurrency(s.targetAmount)}
                  </span>
                  <button
                    className={styles.removeBtn}
                    onClick={() => handleDelete(s.id)}
                  >
                    ✕
                  </button>
                  <button
                    className={styles.addBtn}
                    onClick={() => setSvSelected(s)}
                  >
                    ➕
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

      {svSelected.id !== "" && (
        <div className={styles.card}>
          <p className={styles.cardTitle}>Contribuir a {svSelected.name} </p>
          <div className={styles.addBudgetRow}>
            <input
              type="number"
              style={{ flex: 1 }}
              className={styles.input}
              placeholder="$$$$"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
              }}
            />
            <button className={styles.btnPrimary} onClick={handleContribute}>
              Guardar
            </button>
            <button
              className={styles.btnPrimary}
              style={{ color: "#d85a30" }}
              onClick={() => {
                setSvSelected(emptySv);
                setAmount("");
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className={styles.card}>
        <p className={styles.cardTitle}>Agregar meta de ahorro</p>
        <div className={styles.addBudgetRow}>
          <div className={styles.grid} style={{flex:1}}>
            <div className={styles.field}>
              <input
                className={styles.input}
                style={{ flex: 1 }}
                type="string"
                placeholder="Nombre"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                }}
              />
            </div>
            <div className={styles.field}>
              <input
                className={styles.input}
                style={{ flex: 1 }}
                type="number"
                placeholder="Meta de ahorro"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                min="0"
              />
            </div>
            <div className={styles.field}>
              <input
                className={styles.input}
                style={{ flex: 1 }}
                type="date"
                placeholder="Fecha limite"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
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
