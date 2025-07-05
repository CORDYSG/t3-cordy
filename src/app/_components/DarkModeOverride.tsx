// Create this file: app/_components/DarkReaderOverride.tsx
"use client";

import { useEffect } from "react";

export default function DarkReaderOverride() {
  useEffect(() => {
    // Function to remove DarkReader attributes
    const removeDarkReaderAttributes = () => {
      const html = document.documentElement;
      const body = document.body;

      // Remove DarkReader attributes
      html.removeAttribute("data-darkreader-mode");
      html.removeAttribute("data-darkreader-scheme");
      body.removeAttribute("data-darkreader-mode");
      body.removeAttribute("data-darkreader-scheme");

      // Force light mode styles
      html.style.setProperty("color-scheme", "light", "important");
      html.style.setProperty("background-color", "#fff7e7", "important");
      html.style.setProperty("filter", "none", "important");

      body.style.setProperty("color-scheme", "light", "important");
      body.style.setProperty("background-color", "#fff7e7", "important");
      body.style.setProperty("color", "#1e293b", "important");
      body.style.setProperty("filter", "none", "important");
    };

    // Run immediately
    removeDarkReaderAttributes();

    // Create observer to watch for DarkReader changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes") {
          const attributeName = mutation.attributeName;
          if (attributeName && attributeName.includes("darkreader")) {
            removeDarkReaderAttributes();
          }
        }
      });
    });

    // Observe both html and body for attribute changes
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-darkreader-mode", "data-darkreader-scheme"],
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-darkreader-mode", "data-darkreader-scheme"],
    });

    // Run periodically to catch any missed changes
    const interval = setInterval(removeDarkReaderAttributes, 500);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  return null;
}
