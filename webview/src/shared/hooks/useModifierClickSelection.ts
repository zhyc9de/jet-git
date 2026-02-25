import { useCallback } from "react";

export type SelectionMode = "single" | "toggle" | "range";

export function useModifierClickSelection<T>(
  onSelect: (item: T, mode: SelectionMode) => void,
  onBeforeSelect?: () => void,
) {
  return useCallback(
    (event: React.MouseEvent, item: T) => {
      onBeforeSelect?.();
      if (event.shiftKey) {
        event.preventDefault();
        onSelect(item, "range");
        return;
      }
      if (event.metaKey || event.ctrlKey) {
        onSelect(item, "toggle");
        return;
      }
      onSelect(item, "single");
    },
    [onBeforeSelect, onSelect],
  );
}
