// src/lib/cron.ts
import cron from "node-cron";
import { processAllRecurring } from "../services/recurring.service";

let isRunning = false;

/**
 * Inicia el cron job que procesa recurrencias vencidas.
 * Corre todos los días a las 00:05 (5 minutos después de medianoche).
 */
export function startRecurringCron() {
  // "5 0 * * *" = 00:05 todos los días
  const job = cron.schedule("5 0 * * *", async () => {
    if (isRunning) {
      console.log("[cron] Procesamiento anterior todavía en curso, saltando...");
      return;
    }

    isRunning = true;
    const startedAt = Date.now();
    console.log("[cron] Procesando transacciones recurrentes...");

    try {
      const result = await processAllRecurring();
      const elapsed = ((Date.now() - startedAt) / 1000).toFixed(2);
      console.log(
        `[cron] ✅ Completado en ${elapsed}s — ` +
        `usuarios: ${result.usersProcessed}, ` +
        `generadas: ${result.totalGenerated}, ` +
        `desactivadas: ${result.totalDeactivated}`
      );
    } catch (err) {
      console.error("[cron] ❌ Error al procesar recurrencias:", err);
    } finally {
      isRunning = false;
    }
  });

  console.log("[cron] Cron de recurrencias iniciado (00:05 diario)");
  return job;
}
