import { Account, AppwriteException, Client, Databases, Permission, Role } from "node-appwrite";

interface ApiRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  setHeader: (name: string, value: string) => void;
  json: (body: unknown) => void;
}

interface KeyStatPayload {
  key: string;
  totalPresses: number;
  errors: number;
  totalDelayMs: number;
}

type StatsPayload = Record<string, KeyStatPayload>;

const endpoint = process.env.VITE_APPWRITE_ENDPOINT || "https://sgp.cloud.appwrite.io/v1";
const projectId = process.env.VITE_APPWRITE_PROJECT_ID || "";
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID || "codetype";
const collectionId = process.env.VITE_APPWRITE_KEYBOARD_STATS_COLLECTION_ID || "keyboard_stats";
const apiKey = process.env.APPWRITE_API_KEY;
const ALLOWED_KEYS = new Set([
  "`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=",
  "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",
  "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'",
  "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/",
  "SPACE", "ENTER", "TAB", "BACKSPACE", "CAPS",
  "SHIFT_L", "SHIFT_R", "CTRL_L", "CTRL_R", "ALT_L", "ALT_R",
]);

function createClient(jwt?: string): Client {
  const client = new Client().setEndpoint(endpoint).setProject(projectId);
  if (jwt) client.setJWT(jwt);
  else if (apiKey) client.setKey(apiKey);
  return client;
}

async function authenticate(req: ApiRequest): Promise<string | null> {
  const header = req.headers.authorization || req.headers["x-appwrite-jwt"];
  const raw = Array.isArray(header) ? header[0] : header;
  if (!raw) return null;
  try {
    const token = raw.startsWith("Bearer ") ? raw.slice(7) : raw;
    return (await new Account(createClient(token)).get()).$id;
  } catch {
    return null;
  }
}

function parseStats(value: unknown): StatsPayload {
  if (!value || typeof value !== "object") return {};
  const stats: StatsPayload = {};
  for (const [key, raw] of Object.entries(value)) {
    if (!ALLOWED_KEYS.has(key) || !raw || typeof raw !== "object") continue;
    const item = raw as Partial<KeyStatPayload>;
    const totalPresses = Math.min(1_000_000, Math.max(0, Math.round(Number(item.totalPresses) || 0)));
    const errors = Math.min(totalPresses, Math.max(0, Math.round(Number(item.errors) || 0)));
    const totalDelayMs = Math.min(2_000_000_000, Math.max(0, Math.round(Number(item.totalDelayMs) || 0)));
    if (totalPresses > 0) stats[key] = { key, totalPresses, errors, totalDelayMs };
  }
  return stats;
}

function mergeStats(base: StatsPayload, delta: StatsPayload): StatsPayload {
  const merged = { ...base };
  for (const [key, stat] of Object.entries(delta)) {
    const current = merged[key];
    merged[key] = current
      ? {
          key,
          totalPresses: current.totalPresses + stat.totalPresses,
          errors: current.errors + stat.errors,
          totalDelayMs: current.totalDelayMs + stat.totalDelayMs,
        }
      : stat;
  }
  return merged;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Appwrite-JWT");
  res.setHeader("Cache-Control", "private, no-store");

  if (req.method === "OPTIONS") return void res.status(200).json({ ok: true });
  if (req.method !== "GET" && req.method !== "POST") return void res.status(405).json({ error: "Method not allowed." });
  if (!projectId || !apiKey) return void res.status(503).json({ error: "Keyboard analytics sync is not configured." });

  const userId = await authenticate(req);
  if (!userId) return void res.status(401).json({ error: "Authentication required." });

  const databases = new Databases(createClient());
  if (req.method === "GET") {
    try {
      const document = await databases.getDocument({ databaseId, collectionId, documentId: userId });
      return void res.status(200).json({ stats: parseStats(JSON.parse(String(document.statsJson || "{}"))) });
    } catch (error) {
      if (error instanceof AppwriteException && error.code === 404) return void res.status(200).json({ stats: {} });
      console.error("Unable to load keyboard stats:", error);
      return void res.status(503).json({ error: "Keyboard analytics could not be loaded." });
    }
  }

  let body: { batchId?: string; stats?: unknown } | undefined;
  try {
    body = (typeof req.body === "string" ? JSON.parse(req.body) : req.body) as typeof body;
  } catch {
    return void res.status(400).json({ error: "Invalid JSON payload." });
  }
  const batchId = body?.batchId?.trim();
  const delta = parseStats(body?.stats);
  if (!batchId || batchId.length > 100 || !/^[a-zA-Z0-9_-]+$/.test(batchId) || Object.keys(delta).length === 0) {
    return void res.status(400).json({ error: "Invalid keyboard analytics batch." });
  }

  try {
    let currentStats: StatsPayload = {};
    let processedBatchIds: string[] = [];
    try {
      const document = await databases.getDocument({ databaseId, collectionId, documentId: userId });
      currentStats = parseStats(JSON.parse(String(document.statsJson || "{}")));
      const parsedBatchIds = JSON.parse(String(document.processedBatchIds || "[]")) as unknown;
      processedBatchIds = Array.isArray(parsedBatchIds)
        ? parsedBatchIds.filter((value): value is string => typeof value === "string")
        : [];
    } catch (error) {
      if (!(error instanceof AppwriteException) || error.code !== 404) throw error;
    }

    if (processedBatchIds.includes(batchId)) return void res.status(200).json({ synced: true, duplicate: true });
    const data = {
      userId,
      statsJson: JSON.stringify(mergeStats(currentStats, delta)),
      processedBatchIds: JSON.stringify([...processedBatchIds, batchId].slice(-60)),
      updatedAt: new Date().toISOString(),
    };

    try {
      await databases.updateDocument({ databaseId, collectionId, documentId: userId, data });
    } catch (error) {
      if (!(error instanceof AppwriteException) || error.code !== 404) throw error;
      await databases.createDocument({
        databaseId,
        collectionId,
        documentId: userId,
        data,
        permissions: [Permission.read(Role.user(userId))],
      });
    }
    return void res.status(200).json({ synced: true });
  } catch (error) {
    console.error("Unable to sync keyboard stats:", error);
    return void res.status(503).json({ error: "Keyboard analytics could not be synced." });
  }
}
