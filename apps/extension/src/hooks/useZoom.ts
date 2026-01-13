import { useEffect, useState } from 'react';

const MIN_ZOOM = 75; // 75%
const MAX_ZOOM = 150; // 150%
const ZOOM_STEP = 10; // 10% steps
const DEFAULT_ZOOM = 100;
const STORAGE_KEY = 'mavin-ui-zoom';

export function useZoom() {
    const [zoomLevel, setZoomLevel] = useState<number>(() => {
        // Initialize from local storage
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? parseInt(saved, 10) : DEFAULT_ZOOM;
    });

    // Apply zoom to document root
    useEffect(() => {
        // Tailwind uses rems. By changing the root font size, we scale the entire UI.
        // Default browser font size is usually 16px.
        // 100% = 16px (or whatever the user agent default is, but we'll base it on 16px for consistency)
        // Actually, setting percentage on html is safer: font-size: 100% = 16px.
        // So we can just set the percentage directly.

        document.documentElement.style.fontSize = `${zoomLevel}%`;
        localStorage.setItem(STORAGE_KEY, zoomLevel.toString());
    }, [zoomLevel]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check for Cmd (Mac) or Ctrl (Windows/Linux)
            if (e.metaKey || e.ctrlKey) {
                if (e.key === '=' || e.key === '+') {
                    e.preventDefault();
                    setZoomLevel((prev) => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
                } else if (e.key === '-') {
                    e.preventDefault();
                    setZoomLevel((prev) => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
                } else if (e.key === '0') {
                    e.preventDefault();
                    setZoomLevel(DEFAULT_ZOOM);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return { zoomLevel, setZoomLevel };
}
