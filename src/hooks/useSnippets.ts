import { useState, useEffect, useCallback, useRef } from 'react';
import type { Snippet, SnippetLength } from '../types';
import { getRandomSnippet as getStaticSnippet, SNIPPETS as ALL_STATIC_SNIPPETS } from '../data/snippets';
import { fetchSnippetsForLanguage } from '../data/github';
import { SNIPPET_LENGTH_SPEC } from '../utils/ranking';

function getStaticPool(language?: string): Snippet[] {
  const pool = !language || language === 'All'
    ? ALL_STATIC_SNIPPETS
    : ALL_STATIC_SNIPPETS.filter((s) => s.language === language);
  return pool.length > 0 ? pool : ALL_STATIC_SNIPPETS;
}

/** Cut at a line boundary when one is available, so a snippet never ends mid-statement. */
function trimToLimit(code: string, limit: number): string {
  if (code.length <= limit) return code;
  const cutAt = code.lastIndexOf('\n', limit);
  const sliced = cutAt > limit / 3 ? code.slice(0, cutAt) : code.slice(0, limit);
  return sliced.trimEnd();
}

function prepareSnippet(snippets: Snippet[], length: SnippetLength): Snippet {
  if (snippets.length === 0) return getStaticSnippet();

  const spec = SNIPPET_LENGTH_SPEC[length];
  const first = snippets[0];
  // Prevent mixing repos or languages in a combined run: prefer same repo, fallback to same language.
  const repoName = first.source?.repo;
  const sameRepo = repoName ? snippets.filter((s) => s.language === first.language && s.source?.repo === repoName) : [];
  const candidates = sameRepo.length >= spec.targetBlocks ? sameRepo : snippets.filter((s) => s.language === first.language);

  const parts: string[] = [];
  let totalLen = 0;

  for (const candidate of candidates) {
    // Keep pulling blocks past the target count until the length floor is met,
    // otherwise a "long" run could end up shorter than a "medium" one.
    if (parts.length >= spec.targetBlocks && totalLen >= spec.minChars) break;
    const separator = parts.length > 0 ? 2 : 0;
    const remaining = spec.maxChars - totalLen - separator;
    if (remaining < 60) break;
    const code = trimToLimit(candidate.code.trim(), remaining);
    if (!code) continue;
    parts.push(code);
    totalLen += code.length + separator;
  }

  if (parts.length === 0) return { ...first, code: trimToLimit(first.code.trim(), spec.maxChars) };

  const combined = parts.join('\n\n');
  const singleBlock = parts.length === 1;
  return {
    ...first,
    id: singleBlock ? first.id : `${first.id}-${length}-${parts.length}`,
    code: combined,
    // Only a single-block run can honestly claim one file as its origin.
    filename: singleBlock ? first.filename : undefined,
    source: singleBlock ? first.source : undefined,
  };
}

export function useSnippets(language?: string, length: SnippetLength = 'medium') {
  const [dynamicSnippets, setDynamicSnippets] = useState<Record<string, Snippet[]>>({});
  const [loading, setLoading] = useState(false);
  const fetchedLangs = useRef(new Set<string>());
  const lastSnippetId = useRef<string | null>(null);

  useEffect(() => {
    const languages = language === 'All'
      ? ['JavaScript', 'TypeScript', 'React', 'Python', 'Go']
      : language ? [language] : [];
    const pending = languages.filter((lang) => !fetchedLangs.current.has(lang));
    if (pending.length === 0) return;
    pending.forEach((lang) => fetchedLangs.current.add(lang));

    setLoading(true);
    Promise.all(pending.map(async (lang) => ({ lang, snippets: await fetchSnippetsForLanguage(lang) })))
      .then((results) => {
        setDynamicSnippets((prev) => {
          const next = { ...prev };
          results.forEach(({ lang, snippets }) => { next[lang] = snippets; });
          return next;
        });
      })
      .catch(() => {
        // silent fallback
      })
      .finally(() => setLoading(false));
  }, [language]);

  const getRandomSnippet = useCallback((): Snippet => {
    const selectedLanguage = language === 'All' ? undefined : language;
    const matchingDynamicSnippets = selectedLanguage
      ? (dynamicSnippets[selectedLanguage] ?? [])
      : Object.values(dynamicSnippets).flat();

    const pool = matchingDynamicSnippets.length > 0
      ? matchingDynamicSnippets
      : getStaticPool(selectedLanguage);

    const alternatives = pool.filter((snippet) => snippet.id !== lastSnippetId.current);
    const usePool = alternatives.length > 0 ? alternatives : pool;
    const idx = Math.floor(Math.random() * usePool.length);
    const rotated = [...usePool.slice(idx), ...usePool.slice(0, idx)];
    const snippet = prepareSnippet(rotated, length);
    lastSnippetId.current = snippet.id;
    return snippet;
  }, [language, dynamicSnippets, length]);

  return { loading, getRandomSnippet };
}
