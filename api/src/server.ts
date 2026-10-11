import { Server as SocketIOServer } from "socket.io";
import { env } from "@/config/env";
import { createApp } from "@/app";
import { prisma } from "@/config/prisma";
import { startNotificationScheduler } from "@/modules/notifications/scheduler";
import { setIO } from "@/realtime/io";
import { socketAuthMiddleware } from "@/realtime/socketAuth";
import { registerMessagingSocketHandlers } from "@/realtime/messagingSocket";
import { registerNotificationsSocketHandlers } from "@/realtime/notificationsSocket";

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(
    `🚀 API démarrée sur http://localhost:${env.PORT} (${env.NODE_ENV})`,
  );
});

// POC scopé à la messagerie (voir évaluation stratégique) — même origine et
// mêmes cookies que l'API REST, jamais une configuration CORS parallèle.
const io = new SocketIOServer(server, {
  cors: { origin: env.CORS_ORIGIN, credentials: true },
});
io.use(socketAuthMiddleware);
registerMessagingSocketHandlers(io);
registerNotificationsSocketHandlers(io);
setIO(io);

// Le planificateur nécessite un processus Node persistant — jamais démarré en
// test (vitest n'importe pas ce fichier, mais garde explicite par prudence).
if (env.NODE_ENV !== "test") {
  startNotificationScheduler();
}

async function shutdown(signal: string) {
  console.log(`\n${signal} reçu, arrêt propre du serveur...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
