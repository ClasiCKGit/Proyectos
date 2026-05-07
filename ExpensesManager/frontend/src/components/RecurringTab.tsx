// src/components/RecurringTab.tsx
import React, { useState } from "react";
import type {
  ProyectedMonthly,
  RecurringTransaction,
  UpcomingOccurrence,
} from "../api/recurring";
import type { Category } from "../types";
import {
  formatCurrency,
  formatDate,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
} from "../utils/helpers";
import styles from "../styles/RecurringTab.module.css";
import { CategorySelect } from "./ui/CategorySelect";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const RECURRENCE_LABELS = {
  daily: "Diaria",
  weekly: "Semanal",
  monthly: "Mensual",
  yearly: "Anual",
};

const RECURRENCE_ICONS = {
  daily: "📅",
  weekly: "🗓",
  monthly: "📆",
  yearly: "🗃",
};

// ─── NOTIFICATION BANNER ─────────────────────────────────────────────────────

export const RecurringNotificationBanner: React.FC<{
  generated: Array<{ description: string; date: string; amount: number }>;
  onDismiss: () => void;
}> = ({ generated, onDismiss }) => {
  if (!generated.length) return null;

  return (
    <div className={styles.nbWrapper}>
      <div className={styles.icon}>🔄</div>
      <div className={styles.content}>
        <div className={styles.title}>
          {generated.length === 1
            ? "1 transacción recurrente registrada"
            : `${generated.length} transacciones recurrentes registradas`}
        </div>
        <div className={styles.list}>
          {generated.slice(0, 3).map((g, i) => (
            <span key={i} className={styles.item}>
              {g.description} — {formatCurrency(g.amount)} ({formatDate(g.date)}
              )
            </span>
          ))}
          {generated.length > 3 && (
            <span className={styles.item}>y {generated.length - 3} más...</span>
          )}
        </div>
      </div>
      <button className={styles.close} onClick={onDismiss}>
        ✕
      </button>
    </div>
  );
};

// ─── RECURRING FORM ───────────────────────────────────────────────────────────

interface FormData {
  type: "expense" | "income";
  amount: string;
  description: string;
  category: Category;
  recurrence: "daily" | "weekly" | "monthly" | "yearly";
  startDate: string;
  endDate: string;
  tags: string;
  notes: string;
}

const EMPTY_FORM: FormData = {
  type: "expense",
  amount: "",
  description: "",
  category: "savings",
  recurrence: "monthly",
  startDate: new Date().toISOString().split("T")[0],
  endDate: "",
  tags: "",
  notes: "",
};

const RecurringForm: React.FC<{
  initial?: RecurringTransaction;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}> = ({ initial, onSubmit, onCancel }) => {
  const [form, setForm] = useState<FormData>(
    initial
      ? {
          type: initial.type,
          amount: String(initial.amount),
          description: initial.description,
          category: initial.category as Category,
          recurrence: initial.recurrence,
          startDate: initial.startDate,
          endDate: initial.endDate ?? "",
          tags: initial.tags.join(", "),
          notes: initial.notes ?? "",
        }
      : { ...EMPTY_FORM },
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  //States para el CategorySelect
  const [open, setOpen] = useState<boolean>(false);
  const [category, setCategory] = useState<Category>("food");

  const set =
    (k: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async () => {
    const amount = parseFloat(form.amount);
    if (!form.description.trim()) {
      setError("La descripción es obligatoria");
      return;
    }
    if (!amount || amount <= 0) {
      setError("El monto debe ser mayor a 0");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await onSubmit({
        type: form.type,
        amount,
        description: form.description.trim(),
        category: form.category,
        recurrence: form.recurrence,
        startDate: form.startDate,
        endDate: form.endDate || null,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        notes: form.notes.trim() || undefined,
      });
    } catch (e: any) {
      setError(e.message ?? "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.ffWrapper}>
      {/* Type toggle */}
      <div className={styles.typeToggle}>
        {(["expense", "income"] as const).map((t) => (
          <button
            key={t}
            className={`${styles.typeBtn} ${form.type === t ? styles.typeBtnActive : ""}`}
            onClick={() => setForm((p) => ({ ...p, type: t }))}
          >
            {t === "expense" ? "Gasto" : "Ingreso"}
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        <div className={styles.field}>
          <label className={styles.label}>Monto</label>
          <input
            className={styles.input}
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={form.amount}
            onChange={set("amount")}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Recurrencia</label>
          <select
            className={styles.input}
            value={form.recurrence}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                recurrence: e.target.value as FormData["recurrence"],
              }))
            }
          >
            <option value="daily">Diaria</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensual</option>
            <option value="yearly">Anual</option>
          </select>
        </div>

        <div className={styles.field} style={{ gridColumn: "1 / -1" }}>
          <label className={styles.label}>Descripción</label>
          <input
            className={styles.input}
            type="text"
            placeholder="Ej: Alquiler, Netflix, Sueldo..."
            value={form.description}
            onChange={set("description")}
            maxLength={100}
          />
        </div>

        {form.type === "expense" && (
          <div className={styles.field}>
            <label className={styles.label}>Categoría</label>
            <CategorySelect
              category={category}
              open={open}
              setOpen={setOpen}
              setCategory={setCategory}
            />
          </div>
        )}

        <div
          className={styles.field}
          style={form.type !== "expense" ? { gridColumn: "1 / -1" } : {}}
        >
          <label className={styles.label}>Etiquetas</label>
          <input
            className={styles.input}
            type="text"
            placeholder="fijo, servicios..."
            value={form.tags}
            onChange={set("tags")}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Fecha de inicio</label>
          <input
            className={styles.input}
            type="date"
            value={form.startDate}
            onChange={set("startDate")}
            disabled={!!initial}
          />
        </div>

        <div className={styles.field}>
          <label
            className={styles.label}
            style={form.type !== "expense" ? { gridColumn: "1 / -1" } : {}}
          >
            Fecha de fin (opcional)
          </label>
          <input
            className={styles.input}
            type="date"
            value={form.endDate}
            onChange={set("endDate")}
          />
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.actions}>
        <button
          className={styles.btnPrimary}
          style={{ opacity: loading ? 0.7 : 1 }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading
            ? "Guardando..."
            : initial
              ? "Guardar cambios"
              : "Crear recurrencia"}
        </button>
        <button className={styles.btn} onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  );
};

// ─── RECURRING CARD ───────────────────────────────────────────────────────────

const RecurringCard: React.FC<{
  item: RecurringTransaction;
  onEdit: (r: RecurringTransaction) => void;
  onToggle: (id: string) => Promise<RecurringTransaction>;
  onDelete: (id: string) => Promise<void>;
}> = ({ item, onEdit, onToggle, onDelete }) => {
  const [loadingToggle, setLoadingToggle] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const handleToggle = async () => {
    setLoadingToggle(true);
    try {
      await onToggle(item.id);
    } finally {
      setLoadingToggle(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar "${item.description}"?`)) return;
    setLoadingDelete(true);
    try {
      await onDelete(item.id);
    } finally {
      setLoadingDelete(false);
    }
  };

  const category = item.category as Category;

  return (
    <div className={styles.card} style={{ opacity: item.isActive ? 1 : 0.55 }}>
      <div className={styles.header}>
        <div className={styles.left}>
          <div className={styles.iconWrap}>
            <span>{CATEGORY_ICONS[category]}</span>
          </div>
          <div>
            <div className={styles.desc}>{item.description}</div>
            <div className={styles.meta}>
              {CATEGORY_LABELS[category]} ·{" "}
              <span
                style={{
                  color: item.type === "income" ? "#1D9E75" : "inherit",
                }}
              >
                {item.type === "income" ? "+" : "−"}
                {formatCurrency(item.amount)}
              </span>
            </div>
          </div>
        </div>
        <div className={styles.right}>
          <span className={styles.badge}>
            {RECURRENCE_ICONS[item.recurrence]}{" "}
            {RECURRENCE_LABELS[item.recurrence]}
          </span>
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.footerLeft}>
          <span className={styles.footerText}>
            Próxima: <strong>{formatDate(item.nextDueDate)}</strong>
          </span>
          {item.endDate && (
            <span className={styles.footerText}>
              · Fin: {formatDate(item.endDate)}
            </span>
          )}
          {item.tags.length > 0 &&
            item.tags.map((t) => (
              <span key={t} className={styles.tag}>
                {t}
              </span>
            ))}
        </div>
        <div className={styles.actions}>
          <button
            className={`${styles.actionBtn} ${item.isActive ? styles.pause : styles.activate}`}
            onClick={handleToggle}
            disabled={loadingToggle}
            title={item.isActive ? "Pausar" : "Activar"}
          >
            {loadingToggle ? "..." : item.isActive ? "⏸" : "▶"}
          </button>
          <button
            className={styles.actionBtn}
            onClick={() => onEdit(item)}
            title="Editar"
          >
            ✎
          </button>
          <button
            className={`${styles.actionBtn} ${styles.delete}`}
            onClick={handleDelete}
            disabled={loadingDelete}
            title="Eliminar"
          >
            {loadingDelete ? "..." : "✕"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── UPCOMING CALENDAR ────────────────────────────────────────────────────────

const UpcomingCalendar: React.FC<{ upcoming: UpcomingOccurrence[] }> = ({
  upcoming,
}) => {
  if (!upcoming.length) return null;

  // Group by week
  const grouped: Record<string, UpcomingOccurrence[]> = {};
  upcoming.forEach((o) => {
    const d = new Date(o.date + "T00:00:00");
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().split("T")[0];
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(o);
  });

  return (
    <div className={styles.ucWrapper}>
      {Object.entries(grouped).map(([weekKey, items]) => {
        const weekStart = new Date(weekKey + "T00:00:00");
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const totalExpenses = items
          .filter((i) => i.type === "expense")
          .reduce((a, i) => a + i.amount, 0);
        const totalIncome = items
          .filter((i) => i.type === "income")
          .reduce((a, i) => a + i.amount, 0);

        return (
          <div key={weekKey} className={styles.week}>
            <div className={styles.weekHeader}>
              <span className={styles.weekLabel}>
                {weekStart.toLocaleDateString("es-AR", {
                  day: "numeric",
                  month: "short",
                })}{" "}
                –{" "}
                {weekEnd.toLocaleDateString("es-AR", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
              <div className={styles.weekTotals}>
                {totalIncome > 0 && (
                  <span
                    style={{
                      color: "#1D9E75",
                      fontSize: 12,
                    }}
                  >
                    +{formatCurrency(totalIncome)}
                  </span>
                )}
                {totalExpenses > 0 && (
                  <span
                    style={{
                      color: "#D85A30",
                      fontSize: 12,
                    }}
                  >
                    −{formatCurrency(totalExpenses)}
                  </span>
                )}
              </div>
            </div>
            {items.map((o, i) => {
              const category = o.category as Category;
              return (
                <div key={i} className={styles.item}>
                  <span className={styles.itemDate}>
                    {formatDate(o.date, {
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                  <span className={styles.itemIcon}>
                    {CATEGORY_ICONS[category]}
                  </span>
                  <span className={styles.itemDesc}>{o.description}</span>
                  <span
                    className={styles.itemAmount}
                    style={{
                      color: o.type === "income" ? "#1D9E75" : "inherit",
                    }}
                  >
                    {o.type === "income" ? "+" : "−"}
                    {formatCurrency(o.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

interface RecurringTabProps {
  items: RecurringTransaction[];
  upcoming: UpcomingOccurrence[];
  monthly: ProyectedMonthly
  newlyGenerated: Array<{
    description: string;
    date: string;
    amount: number;
  }>;
  onAdd: (data: any) => Promise<RecurringTransaction>;
  onEdit: (id: string, data: any) => Promise<RecurringTransaction>;
  onToggle: (id: string) => Promise<RecurringTransaction>;
  onDelete: (id: string) => Promise<void>;
  onDismissNotifications: () => void;
}

export const RecurringTab: React.FC<RecurringTabProps> = ({
  items,
  upcoming,
  monthly,
  newlyGenerated,
  onAdd,
  onEdit,
  onToggle,
  onDelete,
  onDismissNotifications,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<
    RecurringTransaction | undefined
  >();
  const [view, setView] = useState<"list" | "calendar">("list");

  const active = items.filter((r) => r.isActive);
  const paused = items.filter((r) => !r.isActive);

  const handleFormSubmit = async (data: any) => {
    if (editingItem) {
      await onEdit(editingItem.id, data);
      setEditingItem(undefined);
    } else {
      await onAdd(data);
      setShowForm(false);
    }
  };

  return (
    <div className={styles.msWrapper}>
      {/* Notification banner */}
      <RecurringNotificationBanner
        generated={newlyGenerated}
        onDismiss={onDismissNotifications}
      />

      {/* Summary */}
      {items.length > 0 && (
        <div className={styles.summary}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Activas</span>
            <span className={styles.summaryValue}>{active.length}</span>
          </div>
          <div className={styles.summaryDivider} />
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Gasto mensual fijo</span>
            <span className={styles.summaryValue} style={{ color: "#D85A30" }}>
              {formatCurrency(monthly.monthlyExp)}
            </span>
          </div>
          <div className={styles.summaryDivider} />
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Ingreso mensual fijo</span>
            <span className={styles.summaryValue} style={{ color: "#1D9E75" }}>
              {formatCurrency(monthly.monthlyInc)}
            </span>
          </div>
          <div className={styles.summaryDivider} />
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Pausadas</span>
            <span className={styles.summaryValue}>{paused.length}</span>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.viewToggle}>
          <button
            className={`${styles.viewBtn} ${view === "list" ? styles.viewBtnActive : ""}`}
            onClick={() => setView("list")}
          >
            Lista
          </button>
          <button
            className={`${styles.viewBtn} ${view === "calendar" ? styles.viewBtnActive : ""}`}
            onClick={() => setView("calendar")}
          >
            Próximos 30 días
          </button>
        </div>
        <button
          className={styles.addBtn}
          onClick={() => {
            setShowForm(true);
            setEditingItem(undefined);
          }}
        >
          + Nueva recurrencia
        </button>
      </div>

      {/* Form */}
      {(showForm || editingItem) && (
        <div className={styles.formCard}>
          <p className={styles.formTitle}>
            {editingItem ? "Editar recurrencia" : "Nueva recurrencia"}
          </p>
          <RecurringForm
            initial={editingItem}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingItem(undefined);
            }}
          />
        </div>
      )}

      {/* Content */}
      {view === "list" ? (
        items.length === 0 ? (
          <div className={styles.empty}>
            No tenés transacciones recurrentes configuradas.
          </div>
        ) : (
          <div className={styles.list}>
            {active.length > 0 && (
              <>
                <div className={styles.sectionLabel}>
                  Activas ({active.length})
                </div>
                {active.map((r) => (
                  <RecurringCard
                    key={r.id}
                    item={r}
                    onEdit={(item) => {
                      setEditingItem(item);
                      setShowForm(false);
                    }}
                    onToggle={onToggle}
                    onDelete={onDelete}
                  />
                ))}
              </>
            )}
            {paused.length > 0 && (
              <>
                <div className={styles.sectionLabel} style={{ marginTop: 12 }}>
                  Pausadas ({paused.length})
                </div>
                {paused.map((r) => (
                  <RecurringCard
                    key={r.id}
                    item={r}
                    onEdit={(item) => {
                      setEditingItem(item);
                      setShowForm(false);
                    }}
                    onToggle={onToggle}
                    onDelete={onDelete}
                  />
                ))}
              </>
            )}
          </div>
        )
      ) : upcoming.length === 0 ? (
        <div className={styles.empty}>
          No hay vencimientos en los próximos 30 días.
        </div>
      ) : (
        <UpcomingCalendar upcoming={upcoming} />
      )}
    </div>
  );
};
