import { useEffect } from 'react';

interface KeyboardShortcutOptions {
    key: string;
    ctrlKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    callback: () => void;
}

/**
 * Hook for keyboard shortcut detection
 * 
 * @example
 * // Listen for Cmd/Ctrl + K
 * useKeyboardShortcut({
 *   key: 'k',
 *   ctrlKey: true,
 *   metaKey: true,
 *   callback: () => searchInputRef.current?.focus()
 * });
 */
export function useKeyboardShortcut({
    key,
    ctrlKey = false,
    metaKey = false,
    shiftKey = false,
    altKey = false,
    callback
}: KeyboardShortcutOptions) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Check if the key matches
            if (event.key.toLowerCase() !== key.toLowerCase()) return;

            // Check modifiers
            // For Cmd/Ctrl + K, we want either Ctrl (Windows/Linux) or Meta (Mac)
            const ctrlOrMeta = ctrlKey || metaKey;
            const hasCorrectModifier = ctrlOrMeta
                ? (event.ctrlKey || event.metaKey)
                : true;

            if (!hasCorrectModifier) return;
            if (shiftKey && !event.shiftKey) return;
            if (altKey && !event.altKey) return;

            // Prevent default browser behavior
            event.preventDefault();
            callback();
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [key, ctrlKey, metaKey, shiftKey, altKey, callback]);
}
