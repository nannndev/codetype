import type { Snippet } from '../types';
import { selectCodeDenseSnippet } from '../utils/snippet-cleanup';

interface RepoSource {
  owner: string;
  repo: string;
  /** Optional prefix filter. Files anywhere under it qualify — the tree is walked recursively. */
  path: string;
  languages: string[];
}

/**
 * Several repositories per language, so a language never depends on one repo
 * staying reachable and the same files do not come back every session.
 */
const REPO_SOURCES: RepoSource[] = [
  // TypeScript / React / JavaScript
  { owner: 'TanStack', repo: 'query', path: 'packages', languages: ['TypeScript', 'React'] },
  { owner: 'shadcn-ui', repo: 'ui', path: 'packages', languages: ['TypeScript', 'React'] },
  { owner: 'vercel', repo: 'next.js', path: 'packages/next/src', languages: ['JavaScript', 'TypeScript'] },
  { owner: 'tailwindlabs', repo: 'tailwindcss', path: 'packages', languages: ['TypeScript'] },
  { owner: 'vuejs', repo: 'core', path: 'packages', languages: ['TypeScript'] },
  { owner: 'facebook', repo: 'react', path: 'packages', languages: ['JavaScript', 'React'] },
  { owner: 'expressjs', repo: 'express', path: 'lib', languages: ['JavaScript'] },
  { owner: 'axios', repo: 'axios', path: 'lib', languages: ['JavaScript'] },
  { owner: 'mui', repo: 'material-ui', path: 'packages', languages: ['React', 'TypeScript'] },

  // Rust
  { owner: 'rust-lang', repo: 'rust', path: 'library/std/src', languages: ['Rust'] },
  { owner: 'tokio-rs', repo: 'tokio', path: 'tokio/src', languages: ['Rust'] },
  { owner: 'serde-rs', repo: 'serde', path: 'serde/src', languages: ['Rust'] },
  { owner: 'clap-rs', repo: 'clap', path: 'clap_builder/src', languages: ['Rust'] },

  // Python
  { owner: 'psf', repo: 'requests', path: 'src/requests', languages: ['Python'] },
  { owner: 'pallets', repo: 'flask', path: 'src/flask', languages: ['Python'] },
  { owner: 'encode', repo: 'httpx', path: 'httpx', languages: ['Python'] },
  { owner: 'fastapi', repo: 'fastapi', path: 'fastapi', languages: ['Python'] },
  { owner: 'pydantic', repo: 'pydantic', path: 'pydantic', languages: ['Python'] },

  // Go
  { owner: 'gin-gonic', repo: 'gin', path: '', languages: ['Go'] },
  { owner: 'gofiber', repo: 'fiber', path: '', languages: ['Go'] },
  { owner: 'spf13', repo: 'cobra', path: '', languages: ['Go'] },
  { owner: 'go-chi', repo: 'chi', path: '', languages: ['Go'] },

  // PHP — these repos are folders-only at the top level, so a recursive walk is required
  { owner: 'laravel', repo: 'framework', path: 'src/Illuminate', languages: ['PHP'] },
  { owner: 'symfony', repo: 'symfony', path: 'src/Symfony/Component', languages: ['PHP'] },
  { owner: 'guzzle', repo: 'guzzle', path: 'src', languages: ['PHP'] },
  { owner: 'slimphp', repo: 'Slim', path: 'Slim', languages: ['PHP'] },
  { owner: 'nette', repo: 'utils', path: 'src', languages: ['PHP'] },

  // Kotlin
  { owner: 'square', repo: 'okhttp', path: 'okhttp/src/main/kotlin', languages: ['Kotlin'] },
  { owner: 'square', repo: 'retrofit', path: '', languages: ['Kotlin'] },
  { owner: 'Kotlin', repo: 'kotlinx.coroutines', path: 'kotlinx-coroutines-core', languages: ['Kotlin'] },
  { owner: 'ktorio', repo: 'ktor', path: 'ktor-http', languages: ['Kotlin'] },

  // Swift
  { owner: 'Alamofire', repo: 'Alamofire', path: 'Source', languages: ['Swift'] },
  { owner: 'apple', repo: 'swift-algorithms', path: 'Sources', languages: ['Swift'] },
  { owner: 'apple', repo: 'swift-collections', path: 'Sources', languages: ['Swift'] },
  { owner: 'vapor', repo: 'vapor', path: 'Sources', languages: ['Swift'] },

  // C
  { owner: 'torvalds', repo: 'linux', path: 'kernel', languages: ['C'] },
  { owner: 'redis', repo: 'redis', path: 'src', languages: ['C'] },
  { owner: 'curl', repo: 'curl', path: 'lib', languages: ['C'] },
  { owner: 'sqlite', repo: 'sqlite', path: 'src', languages: ['C'] },

  // Zig
  { owner: 'ziglang', repo: 'zig', path: 'lib/std', languages: ['Zig'] },
  { owner: 'oven-sh', repo: 'bun', path: 'src', languages: ['Zig'] },

  // Elixir
  { owner: 'phoenixframework', repo: 'phoenix', path: 'lib', languages: ['Elixir'] },
  { owner: 'elixir-ecto', repo: 'ecto', path: 'lib', languages: ['Elixir'] },
  { owner: 'elixir-lang', repo: 'elixir', path: 'lib/elixir/lib', languages: ['Elixir'] },

  // Lua
  { owner: 'Kong', repo: 'kong', path: 'kong', languages: ['Lua'] },
  { owner: 'nvim-lua', repo: 'plenary.nvim', path: 'lua', languages: ['Lua'] },
  { owner: 'folke', repo: 'lazy.nvim', path: 'lua', languages: ['Lua'] },

  // Dart / Flutter
  { owner: 'dart-lang', repo: 'sdk', path: 'sdk/lib', languages: ['Dart'] },
  { owner: 'dart-lang', repo: 'http', path: 'pkgs', languages: ['Dart'] },
  { owner: 'flutter', repo: 'flutter', path: 'packages/flutter/lib/src', languages: ['Flutter'] },
  { owner: 'flutter', repo: 'packages', path: 'packages', languages: ['Flutter'] },
];

interface TreeItem {
  path: string;
  type: 'blob' | 'tree';
  size?: number;
}

/** Directories whose contents make poor typing practice. */
const EXCLUDED_PATHS =
  /(^|\/)(test|tests|__tests__|spec|specs|fixtures|generated|vendor|node_modules|dist|build|examples?|benchmarks?|migrations?|snapshots?|\.github)(\/|$)|\.(test|spec|min|generated|d)\./i;

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

/** Fisher-Yates. `sort(() => Math.random() - 0.5)` is biased and leaves the head of the list in place. */
function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
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

  const storageKey = `codey_snippets_v4_${cacheKey}`;
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
    if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
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
  // Two repos per session, drawn at random, so repeat visits surface different code.
  for (const source of shuffle(sources).slice(0, 2)) {
    try {
      // One rate-limited call per repo. A recursive tree is the only listing that
      // reaches nested files — several repos (Laravel, Symfony) have no files at
      // all directly under their path. `HEAD` avoids a second call for the branch name.
      const tree: { tree: TreeItem[] } = await fetchJSON(
        `${GITHUB_API}/repos/${source.owner}/${source.repo}/git/trees/HEAD?recursive=1`,
      );

      const allowedExtensions = LANGUAGE_EXTENSIONS[lang];
      const files = tree.tree.filter((item) => {
        if (item.type !== 'blob') return false;
        if (source.path && !item.path.startsWith(`${source.path}/`)) return false;
        if (EXCLUDED_PATHS.test(item.path)) return false;
        const size = item.size ?? 0;
        if (size < 400 || size > 20_000) return false;
        const extension = item.path.split('.').pop()?.toLowerCase() ?? '';
        return !allowedExtensions || allowedExtensions.includes(extension);
      });

      // Contents come from raw.githubusercontent.com, which has no API rate limit,
      // so the anonymous 60/hour budget is spent only on the tree call above.
      const picked = shuffle(files).slice(0, 8);
      const fetched = await Promise.all(picked.map(async (file) => {
        try {
          const response = await fetch(
            `https://raw.githubusercontent.com/${source.owner}/${source.repo}/HEAD/${encodeURI(file.path)}`,
          );
          if (!response.ok) return null;
          return { file, code: await response.text() };
        } catch {
          return null;
        }
      }));

      for (const entry of fetched) {
        if (!entry) continue;
        const { file, code } = entry;
        const snippetCode = selectCodeDenseSnippet(code);
        if (!snippetCode) continue;

        const filename = file.path.split('/').pop() ?? file.path;
        const ext = filename.split('.').pop() ?? '';
        const fileLang = lang === 'Flutter' ? 'Flutter' : (extToLanguage(ext) ?? lang);

        snippets.push({
          // Full path, so two files sharing a basename stay distinct.
          id: `${source.owner}-${source.repo}-${file.path}`,
          language: fileLang,
          code: snippetCode,
          filename,
          source: {
            repo: `${source.owner}/${source.repo}`,
            url: `https://github.com/${source.owner}/${source.repo}/blob/HEAD/${file.path}`,
          },
        });
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
