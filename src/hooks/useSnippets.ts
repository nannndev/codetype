import { useState, useEffect, useCallback, useRef } from 'react';
import type { Snippet } from '../types';
import { getRandomSnippet as getStaticSnippet } from '../data/snippets';
import { fetchSnippetsForLanguage } from '../data/github';

export function useSnippets(language?: string) {
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
      return matchingDynamicSnippets[idx];
    }

    return staticSnippet;
  }, [language, dynamicSnippets]);

  return { loading, getRandomSnippet };
}
