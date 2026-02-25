import { useEffect, useRef } from "react";

export function usePreventSelect<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prevent = (e: Event) => e.preventDefault();
    el.addEventListener("selectstart", prevent);
    return () => el.removeEventListener("selectstart", prevent);
  }, []);
  return ref;
}
