import { useEffect, useState } from "react";
import {
  createHighlighter,
  createJavaScriptRegexEngine,
  type Highlighter,
} from "shiki";

// Global singleton to avoid re-initializing
let highlighterInstance: Highlighter | null = null;
let highlighterPromise: Promise<Highlighter> | null = null;

function ensureHighlighter(): Promise<Highlighter> {
  if (highlighterInstance) {
    return Promise.resolve(highlighterInstance);
  }

  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-light", "github-dark"],
      langs: ["javascript", "typescript", "json", "css", "html", "markdown"],
      engine: createJavaScriptRegexEngine(),
    })
      .then((h: Highlighter) => {
        highlighterInstance = h;
        return h;
      })
      .catch((error) => {
        highlighterPromise = null;
        throw error;
      });
  }

  return highlighterPromise;
}

export function useShiki() {
  const [highlighter, setHighlighter] = useState<Highlighter | null>(
    highlighterInstance,
  );

  useEffect(() => {
    let disposed = false;
    ensureHighlighter()
      .then((h) => {
        if (!disposed) {
          setHighlighter(h);
        }
      })
      .catch(() => {
        // errors are logged in ensureHighlighter
      });

    return () => {
      disposed = true;
    };
  }, []);

  return highlighter;
}
