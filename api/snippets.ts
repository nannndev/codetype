interface ApiRequest {
  method?: string;
  query: Record<string, string | string[] | undefined>;
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  setHeader: (name: string, value: string) => void;
  json: (body: unknown) => void;
}

interface RepoCandidate {
  owner: string;
  repo: string;
  defaultBranch: string;
}

interface TreeItem {
  path: string;
  type: 'blob' | 'tree';
  size?: number;
}

interface DynamicSnippet {
  id: string;
  language: string;
  code: string;
  filename: string;
  source: { repo: string; url: string };
}

const GITHUB_API = 'https://api.github.com';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const responseCache = new Map<string, { expiresAt: number; snippets: DynamicSnippet[] }>();

const LANGUAGE_CONFIG: Record<string, {
  githubLanguage: string;
  extensions: string[];
  topic?: string;
  curated: Array<[string, string]>;
}> = {
  TypeScript: { githubLanguage: 'TypeScript', extensions: ['ts', 'tsx'], curated: [['TanStack', 'query'], ['shadcn-ui', 'ui'], ['vercel', 'next.js']] },
  React: { githubLanguage: 'TypeScript', extensions: ['tsx', 'jsx'], topic: 'react', curated: [['TanStack', 'query'], ['facebook', 'react']] },
  JavaScript: { githubLanguage: 'JavaScript', extensions: ['js', 'jsx'], curated: [['expressjs', 'express'], ['vercel', 'next.js']] },
  Rust: { githubLanguage: 'Rust', extensions: ['rs'], curated: [['rust-lang', 'rust'], ['tokio-rs', 'tokio']] },
  Python: { githubLanguage: 'Python', extensions: ['py'], curated: [['psf', 'requests'], ['pallets', 'flask']] },
  Go: { githubLanguage: 'Go', extensions: ['go'], curated: [['gin-gonic', 'gin'], ['gofiber', 'fiber']] },
  PHP: { githubLanguage: 'PHP', extensions: ['php'], curated: [['laravel', 'framework'], ['symfony', 'symfony']] },
  Dart: { githubLanguage: 'Dart', extensions: ['dart'], curated: [['dart-lang', 'sdk'], ['dart-lang', 'http']] },
  Flutter: { githubLanguage: 'Dart', extensions: ['dart'], topic: 'flutter', curated: [['flutter', 'flutter'], ['flutter', 'packages']] },
  Kotlin: { githubLanguage: 'Kotlin', extensions: ['kt'], curated: [['square', 'okhttp']] },
  Swift: { githubLanguage: 'Swift', extensions: ['swift'], curated: [['Alamofire', 'Alamofire']] },
  C: { githubLanguage: 'C', extensions: ['c', 'h'], curated: [['torvalds', 'linux']] },
  Zig: { githubLanguage: 'Zig', extensions: ['zig'], curated: [['ziglang', 'zig']] },
  Elixir: { githubLanguage: 'Elixir', extensions: ['ex', 'exs'], curated: [['phoenixframework', 'phoenix']] },
  Lua: { githubLanguage: 'Lua', extensions: ['lua'], curated: [['Kong', 'kong']] },
};

const EXCLUDED_PATHS = /(^|\/)(test|tests|fixtures|generated|vendor|dist|build|examples?|benchmarks?|migrations?|snapshots?)(\/|$)|\.min\.|\.generated\.|\.g\./i;

function githubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'codetype-snippet-service',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return headers;
}

async function githubJSON<T>(path: string): Promise<T> {
  const response = await fetch(`${GITHUB_API}${path}`, { headers: githubHeaders() });
  if (!response.ok) throw new Error(`GitHub API ${response.status}`);
  return response.json() as Promise<T>;
}

async function discoverRepos(language: string): Promise<RepoCandidate[]> {
  const config = LANGUAGE_CONFIG[language];
  const repos = new Map<string, RepoCandidate>();

  if (process.env.GITHUB_TOKEN) {
    const topic = config.topic ? ` topic:${config.topic}` : '';
    const query = encodeURIComponent(`language:${config.githubLanguage}${topic} stars:>1500 archived:false fork:false`);
    try {
      const result = await githubJSON<{ items: Array<{ owner: { login: string }; name: string; default_branch: string }> }>(
        `/search/repositories?q=${query}&sort=stars&order=desc&per_page=6`,
      );
      for (const item of result.items) {
        repos.set(`${item.owner.login}/${item.name}`, {
          owner: item.owner.login,
          repo: item.name,
          defaultBranch: item.default_branch,
        });
      }
    } catch {
      // Curated repositories below keep the endpoint available if search is limited.
    }
  }

  for (const [owner, repo] of config.curated) {
    const key = `${owner}/${repo}`;
    if (repos.has(key)) continue;
    try {
      const metadata = await githubJSON<{ default_branch: string }>(`/repos/${owner}/${repo}`);
      repos.set(key, { owner, repo, defaultBranch: metadata.default_branch });
    } catch {
      // Skip unavailable repositories.
    }
  }

  return [...repos.values()].slice(0, 5);
}

function selectSnippet(code: string): string | null {
  const sourceLines = code.replace(/\r\n/g, '\n').split('\n');
  const selected: string[] = [];
  let length = 0;

  for (const line of sourceLines.slice(0, 80)) {
    if (line.length > 140) continue;
    if (selected.length > 0 && (selected.length >= 60 || length + line.length + 1 > 2200)) break;
    selected.push(line.replace(/\s+$/g, ''));
    length += line.length + 1;
  }

  const snippet = selected.join('\n').trim();
  return snippet.length >= 80 ? snippet : null;
}

async function snippetsFromRepo(language: string, candidate: RepoCandidate): Promise<DynamicSnippet[]> {
  const config = LANGUAGE_CONFIG[language];
  const tree = await githubJSON<{ tree: TreeItem[]; truncated: boolean }>(
    `/repos/${candidate.owner}/${candidate.repo}/git/trees/${encodeURIComponent(candidate.defaultBranch)}?recursive=1`,
  );

  const files = tree.tree.filter((item) => {
    const extension = item.path.split('.').pop()?.toLowerCase() ?? '';
    return item.type === 'blob'
      && config.extensions.includes(extension)
      && !EXCLUDED_PATHS.test(item.path)
      && (item.size ?? 0) >= 200
      && (item.size ?? 0) <= 20_000;
  });

  // Rotate the candidate window so warm server instances do not always return the same files.
  const start = files.length > 5 ? Math.floor(Math.random() * (files.length - 5)) : 0;
  const candidates = files.slice(start, start + 4);
  const snippets = await Promise.all(candidates.map(async (file) => {
    try {
      const content = await githubJSON<{ content: string; encoding: string }>(
        `/repos/${candidate.owner}/${candidate.repo}/contents/${encodeURIComponent(file.path)}?ref=${encodeURIComponent(candidate.defaultBranch)}`,
      );
      if (content.encoding !== 'base64') return null;
      const binary = atob(content.content.replace(/\n/g, ''));
      const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
      const decoded = new TextDecoder().decode(bytes);
      const code = selectSnippet(decoded);
      if (!code) return null;
      const filename = file.path.split('/').pop() ?? file.path;
      return {
        id: `${candidate.owner}-${candidate.repo}-${file.path}`,
        language,
        code,
        filename,
        source: {
          repo: `${candidate.owner}/${candidate.repo}`,
          url: `https://github.com/${candidate.owner}/${candidate.repo}/blob/${candidate.defaultBranch}/${file.path}`,
        },
      } satisfies DynamicSnippet;
    } catch {
      return null;
    }
  }));

  return snippets.filter((snippet): snippet is DynamicSnippet => snippet !== null);
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method && request.method !== 'GET') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const rawLanguage = request.query.language;
  const language = Array.isArray(rawLanguage) ? rawLanguage[0] : rawLanguage;
  if (!language || !LANGUAGE_CONFIG[language]) {
    response.status(400).json({ error: 'Unsupported language' });
    return;
  }

  const cacheKey = language.toLowerCase();
  const cached = responseCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    response.setHeader('Cache-Control', 'public, s-maxage=21600, stale-while-revalidate=86400');
    response.status(200).json({ snippets: cached.snippets, source: 'cache' });
    return;
  }

  try {
    const repositories = await discoverRepos(language);
    const batches = await Promise.all(repositories.slice(0, 3).map((repo) => snippetsFromRepo(language, repo).catch(() => [])));
    const snippets = batches.flat().slice(0, 12);
    responseCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, snippets });
    response.setHeader('Cache-Control', 'public, s-maxage=21600, stale-while-revalidate=86400');
    response.status(200).json({
      snippets,
      source: process.env.GITHUB_TOKEN ? 'github-search' : 'curated',
    });
  } catch {
    response.status(502).json({ error: 'GitHub source is temporarily unavailable', snippets: [] });
  }
}
declare const process: { env: Record<string, string | undefined> };
