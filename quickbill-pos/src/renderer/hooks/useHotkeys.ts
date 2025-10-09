import { useEffect, useCallback } from 'react';

interface HotkeyConfig {
  [key: string]: () => void;
}

export const useHotkeys = (hotkeys: HotkeyConfig) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger hotkeys when typing in inputs
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement
    ) {
      return;
    }

    const key = event.key;
    const ctrlKey = event.ctrlKey;
    const altKey = event.altKey;
    const shiftKey = event.shiftKey;

    // Build key combination string
    let keyCombo = '';
    if (ctrlKey) keyCombo += 'Ctrl+';
    if (altKey) keyCombo += 'Alt+';
    if (shiftKey) keyCombo += 'Shift+';
    keyCombo += key;

    // Check for exact match first
    if (hotkeys[keyCombo]) {
      event.preventDefault();
      hotkeys[keyCombo]();
      return;
    }

    // Check for key only (without modifiers)
    if (hotkeys[key]) {
      event.preventDefault();
      hotkeys[key]();
      return;
    }

    // Check for special keys
    if (key === 'Escape' && hotkeys['Escape']) {
      event.preventDefault();
      hotkeys['Escape']();
      return;
    }

    if (key === 'Enter' && hotkeys['Enter']) {
      event.preventDefault();
      hotkeys['Enter']();
      return;
    }

    if (key === 'Delete' && hotkeys['Delete']) {
      event.preventDefault();
      hotkeys['Delete']();
      return;
    }

    // Check for function keys
    if (key.startsWith('F') && key.length === 2) {
      const fKey = key.substring(1);
      if (hotkeys[`F${fKey}`]) {
        event.preventDefault();
        hotkeys[`F${fKey}`]();
        return;
      }
    }
  }, [hotkeys]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};

// Hook for specific hotkey combinations
export const useSpecificHotkey = (
  key: string,
  callback: () => void,
  deps: any[] = []
) => {
  const memoizedCallback = useCallback(callback, deps);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger hotkeys when typing in inputs
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const eventKey = event.key;
      const ctrlKey = event.ctrlKey;
      const altKey = event.altKey;
      const shiftKey = event.shiftKey;

      // Build key combination string
      let keyCombo = '';
      if (ctrlKey) keyCombo += 'Ctrl+';
      if (altKey) keyCombo += 'Alt+';
      if (shiftKey) keyCombo += 'Shift+';
      keyCombo += eventKey;

      if (keyCombo === key || eventKey === key) {
        event.preventDefault();
        memoizedCallback();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [key, memoizedCallback]);
};

// Hook for global hotkeys that work everywhere
export const useGlobalHotkeys = (hotkeys: HotkeyConfig) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const key = event.key;
    const ctrlKey = event.ctrlKey;
    const altKey = event.altKey;
    const shiftKey = event.shiftKey;

    // Build key combination string
    let keyCombo = '';
    if (ctrlKey) keyCombo += 'Ctrl+';
    if (altKey) keyCombo += 'Alt+';
    if (shiftKey) keyCombo += 'Shift+';
    keyCombo += key;

    // Check for exact match
    if (hotkeys[keyCombo]) {
      event.preventDefault();
      hotkeys[keyCombo]();
      return;
    }

    // Check for key only
    if (hotkeys[key]) {
      event.preventDefault();
      hotkeys[key]();
      return;
    }
  }, [hotkeys]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};