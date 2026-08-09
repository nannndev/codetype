import type { Snippet } from '../types';

interface RepoSource {
  owner: string;
  repo: string;
  path: string;
  languages: string[];
}

const REPO_SOURCES: RepoSource[] = [
  { owner: 'TanStack', repo: 'query', path: 'packages/react-query/src', languages: ['TypeScript', 'React'] },
  { owner: 'shadcn-ui', repo: 'ui', path: 'packages/cli/src', languages: ['TypeScript'] },
  { owner: 'rust-lang', repo: 'rust', path: 'library/std/src', languages: ['Rust'] },
  { owner: 'psf', repo: 'requests', path: 'src/requests', languages: ['Python'] },
  { owner: 'gin-gonic', repo: 'gin', path: '', languages: ['Go'] },
  { owner: 'vercel', repo: 'next.js', path: 'packages/next/src/client', languages: ['JavaScript', 'TypeScript'] },
  { owner: 'square', repo: 'okhttp', path: 'okhttp/src/main/kotlin/okhttp3', languages: ['Kotlin'] },
  { owner: 'Alamofire', repo: 'Alamofire', path: 'Source', languages: ['Swift'] },
  { owner: 'torvalds', repo: 'linux', path: 'kernel/sched', languages: ['C'] },
  { owner: 'ziglang', repo: 'zig', path: 'lib/std', languages: ['Zig'] },
  { owner: 'phoenixframework', repo: 'phoenix', path: 'lib/phoenix', languages: ['Elixir'] },
  { owner: 'Kong', repo: 'kong', path: 'kong', languages: ['Lua'] },
  { owner: 'expressjs', repo: 'express', path: 'lib', languages: ['JavaScript'] },
  { owner: 'pallets', repo: 'flask', path: 'src/flask', languages: ['Python'] },
  { owner: 'tailwindlabs', repo: 'tailwindcss', path: 'packages/tailwindcss/src', languages: ['TypeScript'] },
  { owner: 'laravel', repo: 'framework', path: 'src/Illuminate', languages: ['PHP'] },
  { owner: 'symfony', repo: 'symfony', path: 'src/Symfony/Component', languages: ['PHP'] },
  { owner: 'dart-lang', repo: 'sdk', path: 'sdk/lib', languages: ['Dart'] },
  { owner: 'flutter', repo: 'flutter', path: 'packages/flutter/lib/src', languages: ['Flutter'] },
];

interface GitHubContent {
  name: string;
  path: string;
  type: 'file' | 'dir';
  download_url: string | null;
}

interface GitHubFile {
  content: string;
  encoding: string;
}

const GITHUB_API = 'https://api.github.com';

const fileCache = new Map<string, Snippet[]>();

const LANGUAGE_EXTENSIONS: Record<string, string[]> = {
  React: ['tsx', 'jsx'],
  TypeScript: ['ts', 'tsx'],
  JavaScript: ['js', 'jsx'],
  Rust: ['rs'],
  Python: ['py'],
  Go: ['go'],
  Kotlin: ['kt'],
  Swift: ['swift'],
  C: ['c', 'h'],
  Zig: ['zig'],
  Elixir: ['ex', 'exs'],
  Lua: ['lua'],
  PHP: ['php'],
  Dart: ['dart'],
  Flutter: ['dart'],
};

function extToLanguage(ext: string): string | null {
  const map: Record<string, string> = {
    ts: 'TypeScript',
    tsx: 'React',
    js: 'JavaScript',
    jsx: 'React',
    rs: 'Rust',
    py: 'Python',
    go: 'Go',
    kt: 'Kotlin',
    swift: 'Swift',
    c: 'C',
    h: 'C',
    zig: 'Zig',
    ex: 'Elixir',
    exs: 'Elixir',
    lua: 'Lua',
    php: 'PHP',
    dart: 'Dart',
    css: 'CSS',
    sql: 'SQL',
    tf: 'Terraform',
    yml: 'YAML',
    yaml: 'YAML',
    graphql: 'GraphQL',
    gql: 'GraphQL',
    sh: 'Bash',
    bash: 'Bash',
    dockerfile: 'Dockerfile',
  };
  return map[ext.toLowerCase()] ?? null;
}

async function fetchJSON(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: { Accept: 'application/vnd.github.v3+json' },
  });
  if (!res.ok) throw new Error(`GitHub API: ${res.status}`);
  return res.json();
}

export async function fetchSnippetsForLanguage(lang: string): Promise<Snippet[]> {
  const cacheKey = lang.toLowerCase();
  if (fileCache.has(cacheKey)) return fileCache.get(cacheKey)!;

  const storageKey = `codetype_snippets_v2_${cacheKey}`;
  try {
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      const parsed = JSON.parse(cached) as { expiresAt: number; snippets: Snippet[] };
      if (parsed.expiresAt > Date.now() && parsed.snippets.length > 0) {
        fileCache.set(cacheKey, parsed.snippets);
        return parsed.snippets;
      }
    }
  } catch {
    // Storage is optional; continue with network sources.
  }

  try {
    const response = await fetch(`/api/snippets?language=${encodeURIComponent(lang)}`);
    if (response.ok) {
      const payload = await response.json() as { snippets?: Snippet[] };
      if (payload.snippets?.length) {
        fileCache.set(cacheKey, payload.snippets);
        try {
          localStorage.setItem(storageKey, JSON.stringify({
            expiresAt: Date.now() + 6 * 60 * 60 * 1000,
            snippets: payload.snippets,
          }));
        } catch {
          // Storage is optional.
        }
        return payload.snippets;
      }
    }
  } catch {
    // Local Vite development has no serverless route; use direct GitHub fallback.
  }

  const sources = REPO_SOURCES.filter((s) =>
    s.languages.some((l) => l.toLowerCase() === lang.toLowerCase()),
  );

  if (sources.length === 0) return [];

  const snippets: Snippet[] = [];

  for (const source of sources.slice(0, 2)) {
    try {
      const dirUrl = source.path
        ? `${GITHUB_API}/repos/${source.owner}/${source.repo}/contents/${source.path}`
        : `${GITHUB_API}/repos/${source.owner}/${source.repo}/contents`;

      const contents: GitHubContent[] = await fetchJSON(dirUrl);
      const allowedExtensions = LANGUAGE_EXTENSIONS[lang];
      const files = contents.filter((c) => {
        const extension = c.name.split('.').pop()?.toLowerCase() ?? '';
        return c.type === 'file'
          && c.name.includes('.')
          && c.name.length < 60
          && (!allowedExtensions || allowedExtensions.includes(extension));
      });

      const candidates = files.slice(0, 5);
      for (const file of candidates) {
        try {
          const fileData: GitHubFile = await fetchJSON(file.path ? `${GITHUB_API}/repos/${source.owner}/${source.repo}/contents/${file.path}` : `${GITHUB_API}/repos/${source.owner}/${source.repo}/contents/${file.name}`);

          if (fileData.encoding === 'base64' && fileData.content) {
            const code = atob(fileData.content.replace(/\n/g, ''));
            const ext = file.name.split('.').pop() ?? '';
            const fileLang = lang === 'Flutter' ? 'Flutter' : (extToLanguage(ext) ?? lang);

            const lines = code.split('\n').slice(0, 25);
            const selectedLines: string[] = [];
            let length = 0;
            for (const line of lines) {
              if (selectedLines.length > 0 && length + line.length + 1 > 600) break;
              selectedLines.push(line);
              length += line.length + 1;
            }
            const snippetCode = selectedLines.join('\n').trimEnd();
            if (snippetCode.length < 20) continue;

            snippets.push({
              id: `${source.owner}-${source.repo}-${file.name}`,
              language: fileLang,
              code: snippetCode,
              filename: file.name,
              source: {
                repo: `${source.owner}/${source.repo}`,
                url: `https://github.com/${source.owner}/${source.repo}/blob/main/${file.path ?? file.name}`,
              },
            });
          }
        } catch {
          // skip individual file errors
        }
      }
    } catch {
      // skip repo errors (rate limit, not found, etc.)
    }
  }

  fileCache.set(cacheKey, snippets);
  if (snippets.length > 0) {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        expiresAt: Date.now() + 6 * 60 * 60 * 1000,
        snippets,
      }));
    } catch {
      // Storage is optional.
    }
  }
  return snippets;
}
