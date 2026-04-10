// src/index.ts
import { createApp } from "./app";
import { prisma } from "./lib/prisma";

const PORT = Number(process.env.PORT ?? 3000);

async function main() {
  await prisma.$connect();
  console.log("✅ Conectado a la base de datos");

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("❌ Error al iniciar el servidor:", err);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
