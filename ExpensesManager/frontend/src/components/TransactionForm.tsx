import React, { useState, useEffect } from "react";
import type { Transaction, Category, RecurrenceType } from "../types";
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  validateTransaction,
  todayISO,
  parseAmountInput,
} from "../utils/helpers";
import styles from './../styles/TransactionForm.module.css'

type FormState = {
  type: "expense" | "income";
  amount: string;
  description: string;
  category: Category;
  date: string;
  tags: string;
  notes: string;
  recurrence: RecurrenceType;
};

const EMPTY_FORM: FormState = {
  type: "expense",
  amount: "",
  description: "",
  category: "food",
  date: todayISO(),
  tags: "",
  notes: "",
  recurrence: "none",
};

interface TransactionFormProps {
  /** Pass a transaction to switch into edit mode */
  initial?: Transaction;
  onSubmit: (
    data: Omit<Transaction, "id" | "createdAt" | "updatedAt">
  ) => void;
  onDelete?: (id: string) => void;
  onCancel?: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  initial,
  onSubmit,
  onDelete,
  onCancel,
}) => {
  const [form, setForm] = useState<FormState>(() =>
    initial
      ? {
          type: initial.type,
          amount: String(initial.amount),
          description: initial.description,
          category: initial.category,
          date: initial.date,
          tags: initial.tags.join(", "),
          notes: initial.notes ?? "",
          recurrence: initial.recurrence,
        }
      : { ...EMPTY_FORM }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initial) {
      setForm({
        type: initial.type,
        amount: String(initial.amount),
        description: initial.description,
        category: initial.category,
        date: initial.date,
        tags: initial.tags.join(", "),
        notes: initial.notes ?? "",
        recurrence: initial.recurrence,
      });
    } else {
      setForm({ ...EMPTY_FORM });
    }
    setErrors({});
  }, [initial]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    const amount = parseAmountInput(form.amount);
    const payload = {
      type: form.type,
      amount,
      description: form.description.trim(),
      category: form.category,
      date: form.date,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      notes: form.notes.trim(),
      recurrence: form.recurrence,
    };

    const validationErrors = validateTransaction(payload);
    if (validationErrors.length) {
      const map: Record<string, string> = {};
      validationErrors.forEach((e) => (map[e.field] = e.message));
      setErrors(map);
      return;
    }

    setErrors({});
    onSubmit(payload);
    if (!initial) setForm({ ...EMPTY_FORM });
  };

  const inputStyle = (field: string): React.CSSProperties => ({
    borderColor: errors[field]
      ? "#D85A30"
      : "var(--color-border, #ddd)",
  });

  return (
    <div className={styles.wrapper}>
      {/* Type toggle */}
      <div className={styles.typeToggle}>
        {(["expense", "income"] as const).map((t) => (
          <button
            key={t}
            className={`${styles.typeBtn} ${form.type === t ? styles.typeBtnActive : ""}`}
            onClick={() => set("type", t)}
          >
            {t === "expense" ? "Gasto" : "Ingreso"}
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        {/* Amount */}
        <div className={styles.field}>
          <label className={styles.label}>Monto</label>
          <input
          className={styles.input}
            style={inputStyle("amount")}
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => set("amount", e.target.value)}
          />
          {errors.amount && <span className={styles.error}>{errors.amount}</span>}
        </div>

        {/* Date */}
        <div className={styles.field}>
          <label className={styles.label}>Fecha</label>
          <input
          className={styles.input}
            style={inputStyle("date")}
            type="date"
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
          />
          {errors.date && <span className={styles.error}>{errors.date}</span>}
        </div>

        {/* Description */}
        <div className={styles.field} style={{ gridColumn: "1 / -1" }}>
          <label className={styles.label}>Descripción</label>
          <input
          className={styles.input}
            style={inputStyle("description")}
            type="text"
            placeholder={`${form.type === "expense" ? "¿En qué gastaste?" : "¿De donde ingreso la plata?"}`}
            maxLength={100}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
          {errors.description && (
            <span className={styles.error}>{errors.description}</span>
          )}
        </div>

        {/* Category */}
        <div className={styles.field}>
          <label className={styles.label}>Categoría</label>
          <select
          className={styles.input}
            style={inputStyle("category")}
            value={form.category}
            onChange={(e) => set("category", e.target.value as Category)}
          >
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {CATEGORY_ICONS[k as Category]} {v}
              </option>
            ))}
          </select>
        </div>

        {/* Recurrence */}
        <div className={styles.field}>
          <label className={styles.label}>Recurrencia</label>
          <select
          className={styles.input}
            style={inputStyle("recurrence")}
            value={form.recurrence}
            onChange={(e) => set("recurrence", e.target.value as RecurrenceType)}
          >
            <option value="none">Sin repetición</option>
            <option value="daily">Diaria</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensual</option>
            <option value="yearly">Anual</option>
          </select>
        </div>

        {/* Tags */}
        <div className={styles.field}>
          <label className={styles.label}>Etiquetas (separadas por coma)</label>
          <input
          className={styles.input}
            style={inputStyle("tags")}
            type="text"
            placeholder="casa, urgente, fijo..."
            value={form.tags}
            onChange={(e) => set("tags", e.target.value)}
          />
        </div>

        {/* Notes */}
        <div className={styles.field}>
          <label className={styles.label}>Notas</label>
          <input
          className={styles.input}
            style={inputStyle("notes")}
            type="text"
            placeholder="Detalle opcional..."
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button className={styles.btnPrimary} onClick={handleSubmit}>
          {initial ? "Guardar cambios" : "Agregar"}
        </button>
        {onCancel && (
          <button className={styles.btn} onClick={onCancel}>
            Cancelar
          </button>
        )}
        {initial && onDelete && (
          <button
            className={styles.btnDanger}
            onClick={() => onDelete(initial.id)}
          >
            Eliminar
          </button>
        )}
      </div>
    </div>
  );
};
