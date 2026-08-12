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

  useEffect(() => {
    const lang = language === 'All' ? undefined : language;
    if (!lang) return;
    if (fetchedLangs.current.has(lang)) return;
    fetchedLangs.current.add(lang);

    setLoading(true);
    fetchSnippetsForLanguage(lang)
      .then((snippets) => {
        setDynamicSnippets((prev) => ({ ...prev, [lang]: snippets }));
      })
      .catch(() => {
        // silent fallback
      })
      .finally(() => setLoading(false));
  }, [language]);

  const getRandomSnippet = useCallback((): Snippet => {
    const selectedLanguage = language === 'All' ? undefined : language;
    const staticSnippet = getStaticSnippet(selectedLanguage);
    const matchingDynamicSnippets = selectedLanguage
      ? (dynamicSnippets[selectedLanguage] ?? [])
      : Object.values(dynamicSnippets).flat();

    if (matchingDynamicSnippets.length > 0 && Math.random() > 0.3) {
      const idx = Math.floor(Math.random() * matchingDynamicSnippets.length);
      const rotated = [...matchingDynamicSnippets.slice(idx), ...matchingDynamicSnippets.slice(0, idx)];
      return combineSnippets(rotated, length);
    }

    return fitSnippet(staticSnippet, length);
  }, [language, dynamicSnippets, length]);

  return { loading, getRandomSnippet };
}
