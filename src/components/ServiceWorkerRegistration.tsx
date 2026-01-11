/**
 * Service Worker Registration Component
 *
 * Registers the service worker on page load and handles updates.
 * Uses silent update strategy - new versions activate on next visit.
 *
 * Place this component in the root layout after ToastProvider.
 *
 * @module components/ServiceWorkerRegistration
 */
"use client";

import { useEffect } from "react";

/**
 * Registers the service worker for PWA offline functionality.
 * Renders nothing (returns null).
 *
 * @example
 * ```tsx
 * // In layout.tsx
 * <body>
 *   <ToastProvider>{children}</ToastProvider>
 *   <ServiceWorkerRegistration />
 * </body>
 * ```
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Only register in production and if service worker is supported
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // Register service worker
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        // Check for updates every hour (silent updates)
        const checkInterval = setInterval(
          () => {
            registration.update();
          },
          60 * 60 * 1000
        ); // 1 hour

        // Cleanup interval on unmount
        return () => clearInterval(checkInterval);
      })
      .catch((error) => {
        console.error("Service Worker registration failed:", error);
      });
  }, []);

  return null;
}
