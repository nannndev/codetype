import { useState, useEffect, useCallback, useRef } from 'react';
import type { Snippet } from '../types';
import { getRandomSnippet as getStaticSnippet } from '../data/snippets';
import { fetchSnippetsForLanguage } from '../data/github';
import type { SnippetLength } from '../types';

const LENGTH_LIMITS: Record<SnippetLength, number> = { short: 500, medium: 1000, long: 2200 };

function fitSnippet(snippet: Snippet, length: SnippetLength): Snippet {
  const limit = LENGTH_LIMITS[length];
  if (snippet.code.length <= limit) return snippet;
  const cutAt = snippet.code.lastIndexOf('\n', limit);
  return { ...snippet, code: snippet.code.slice(0, cutAt > 100 ? cutAt : limit).trimEnd() };
}

function combineSnippets(snippets: Snippet[], length: SnippetLength): Snippet {
  if (length === 'short' || snippets.length < 2) return fitSnippet(snippets[0], length);
  const target = LENGTH_LIMITS[length];
  const parts: string[] = [];
  let total = 0;
  for (const snippet of snippets) {
    if (parts.length > 0 && total + snippet.code.length + 2 > target) break;
    parts.push(snippet.code);
    total += snippet.code.length + 2;
  }
  return fitSnippet({ ...snippets[0], id: `${snippets[0].id}-${length}`, code: parts.join('\n\n') }, length);
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

    if (matchingDynamicSnippets.length > 0) {
      const alternatives = matchingDynamicSnippets.filter((snippet) => snippet.id !== lastSnippetId.current);
      const pool = alternatives.length > 0 ? alternatives : matchingDynamicSnippets;
      const idx = Math.floor(Math.random() * pool.length);
      const rotated = [...pool.slice(idx), ...pool.slice(0, idx)];
      const snippet = combineSnippets(rotated, length);
      lastSnippetId.current = snippet.id;
      return snippet;
    }

    let staticSnippet = getStaticSnippet(selectedLanguage);
    for (let attempt = 0; attempt < 5 && staticSnippet.id === lastSnippetId.current; attempt += 1) {
      staticSnippet = getStaticSnippet(selectedLanguage);
    }
    const snippet = fitSnippet(staticSnippet, length);
    lastSnippetId.current = snippet.id;
    return snippet;
  }, [language, dynamicSnippets, length]);

  return { loading, getRandomSnippet };
}
