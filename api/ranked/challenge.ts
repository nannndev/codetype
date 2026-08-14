import { Client, Databases, Account, Permission, Role } from 'node-appwrite';
import crypto from 'node:crypto';
import { SNIPPETS } from '../../src/data/snippets.js';
import { SNIPPET_LENGTH_SPEC } from '../../src/utils/ranking.js';
import type { SnippetLength, TestMode } from '../../src/types.js';

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

const APPWRITE_ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT = process.env.VITE_APPWRITE_PROJECT_ID || 'codey-main';
const APPWRITE_DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || 'main';
const APPWRITE_RUN_SESSIONS_ID = process.env.VITE_APPWRITE_RUN_SESSIONS_COLLECTION_ID || 'run_sessions';
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;

function getAppwriteAdmin() {
  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT);
  if (APPWRITE_API_KEY) {
    client.setKey(APPWRITE_API_KEY);
  }
  return { client, databases: new Databases(client) };
}

async function authenticateRequest(req: ApiRequest): Promise<string | null> {
  const authHeader = req.headers['authorization'] || req.headers['x-appwrite-jwt'];
  const jwt = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  if (!jwt) return null;

  const token = jwt.startsWith('Bearer ') ? jwt.slice(7) : jwt;
  try {
    const client = new Client()
      .setEndpoint(APPWRITE_ENDPOINT)
      .setProject(APPWRITE_PROJECT)
      .setJWT(token);
    const account = new Account(client);
    const user = await account.get();
    return user.$id;
  } catch {
    return null;
  }
}

function selectSnippetCode(language: string, length: SnippetLength): { code: string; targetChars: number } {
  const spec = SNIPPET_LENGTH_SPEC[length] || SNIPPET_LENGTH_SPEC.medium;
  const pool = SNIPPETS.filter((s) => s.language.toLowerCase() === language.toLowerCase());
  const selectedPool = pool.length > 0 ? pool : SNIPPETS;
  
  const selected = selectedPool[Math.floor(Math.random() * selectedPool.length)];
  let code = selected.code.trim();

  if (code.length > spec.maxChars) {
    const cutAt = code.lastIndexOf('\n', spec.maxChars);
    code = (cutAt > spec.maxChars / 3 ? code.slice(0, cutAt) : code.slice(0, spec.maxChars)).trimEnd();
  }

  return { code, targetChars: code.length };
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Appwrite-JWT');

  if (req.method === 'OPTIONS') {
    res.status(200).json({ ok: true });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const userId = await authenticateRequest(req);
  if (!userId) {
    res.status(401).json({ error: 'Authentication required to enter Ranked Mode.' });
    return;
  }

  const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as {
    language?: string;
    mode?: TestMode;
    snippetLength?: SnippetLength;
    durationSeconds?: number;
  } || {};

  const language = body.language || 'TypeScript';
  const mode = body.mode || 'snippet';
  const snippetLength = body.snippetLength || 'medium';
  const durationSeconds = body.durationSeconds || 30;

  const { code: snippetCode, targetChars } = selectSnippetCode(language, snippetLength);
  const sessionId = crypto.randomUUID().replace(/-/g, '').slice(0, 36);
  const startedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min expiry

  const challengeString = `${sessionId}:${userId}:${language}:${snippetCode}:${startedAt}`;
  const challengeHash = crypto.createHash('sha256').update(challengeString).digest('hex');

  const { databases } = getAppwriteAdmin();

  try {
    const owner = Role.user(userId);
    await databases.createDocument({
      databaseId: APPWRITE_DATABASE_ID,
      collectionId: APPWRITE_RUN_SESSIONS_ID,
      documentId: sessionId,
      data: {
        userId,
        challenge: challengeHash,
        mode,
        language,
        durationSeconds: mode === 'timed' ? durationSeconds : undefined,
        expiresAt,
      },
      permissions: [
        Permission.read(owner),
      ],
    });
  } catch (dbError) {
    console.error('Failed to create run_session document:', dbError);
    res.status(503).json({ error: 'Ranked verification service could not create a challenge session.' });
    return;
  }

  res.status(200).json({
    sessionId,
    challengeHash,
    snippetCode,
    language,
    mode,
    snippetLength,
    durationSeconds,
    targetChars,
    expiresAt,
  });
}
