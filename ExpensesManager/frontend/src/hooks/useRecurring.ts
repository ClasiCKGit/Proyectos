// src/hooks/useRecurring.ts
import { useState, useEffect, useCallback } from "react";
import { recurringApi, type ProyectedMonthly, type RecurringTransaction, type UpcomingOccurrence } from "../api/recurring";

interface RecurringState {
  items: RecurringTransaction[];
  upcoming: UpcomingOccurrence[];
  monthly: ProyectedMonthly;
  loading: boolean;
  error: string | null;
  /** Transacciones generadas en el último procesamiento (para notificar al usuario) */
  newlyGenerated: Array<{ description: string; date: string; amount: number }>;
}

export function useRecurring() {
  const [state, setState] = useState<RecurringState>({
    items: [],
    upcoming: [],
    monthly: {monthlyExp: 0, monthlyInc: 0},
    loading: true,
    error: null,
    newlyGenerated: [],
  });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const [items, upcoming, monthly] = await Promise.all([
        recurringApi.list(),
        recurringApi.upcoming(30),
        recurringApi.monthly()
      ]);
      setState((s) => ({ ...s, items, upcoming, monthly, loading: false }));
    } catch (e: any) {
      setState((s) => ({ ...s, loading: false, error: e.message }));
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  
  // ─── ACTIONS ──────────────────────────────────────────────────────────────

  const addRecurring = useCallback(async (
    data: Parameters<typeof recurringApi.create>[0]
  ) => {
    const created = await recurringApi.create(data);
    setState((s) => ({
      ...s,
      items: [created, ...s.items],
    }));
    // Reload upcoming since new recurrence affects it
    const upcoming = await recurringApi.upcoming(30);
    const monthly = await recurringApi.monthly()
    setState((s) => ({ ...s, upcoming, monthly }));
    return created;
  }, []);

  const editRecurring = useCallback(async (
    id: string,
    data: Partial<RecurringTransaction>
  ) => {
    const updated = await recurringApi.update(id, data);
    setState((s) => ({
      ...s,
      items: s.items.map((r) => (r.id === id ? updated : r)),
    }));
    const upcoming = await recurringApi.upcoming(30);
    const monthly = await recurringApi.monthly()
    setState((s) => ({ ...s, upcoming, monthly }));
    return updated;
  }, []);

  const toggleRecurring = useCallback(async (id: string) => {
    const updated = await recurringApi.toggle(id);
    setState((s) => ({
      ...s,
      items: s.items.map((r) => (r.id === id ? updated : r)),
    }));
    const upcoming = await recurringApi.upcoming(30);
    const monthly = await recurringApi.monthly()
    setState((s) => ({ ...s, upcoming, monthly }));
    return updated;
  }, []);

  const removeRecurring = useCallback(async (id: string) => {
    await recurringApi.remove(id);
    const monthly = await recurringApi.monthly()
    setState((s) => ({
      ...s,
      items: s.items.filter((r) => r.id !== id),
      upcoming: s.upcoming.filter((o) => o.recurringId !== id),
      monthly
    }));
  }, []);

  const processNow = useCallback(async () => {
    const result = await recurringApi.process();
    if (result.generated.length > 0) {
      setState((s) => ({ ...s, newlyGenerated: result.generated }));
      await load(); // refresh list after processing
    }
    return result;
  }, [load]);

  const dismissNotifications = useCallback(() => {
    setState((s) => ({ ...s, newlyGenerated: [] }));
  }, []);

  return {
    ...state,
    addRecurring,
    editRecurring,
    toggleRecurring,
    removeRecurring,
    processNow,
    dismissNotifications,
    reload: load,
  };
}
