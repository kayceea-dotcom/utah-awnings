"use client";

import { useEffect } from "react";

// Browsers change a focused number input's value when the page is scrolled
// over it — easy to trigger by accident right after typing (the input is
// still focused/highlighted). Blur it on scroll so the page just scrolls
// normally instead of silently changing what was just typed.
export default function NumberInputScrollGuard() {
  useEffect(() => {
    function handleWheel() {
      const active = document.activeElement;
      if (active instanceof HTMLInputElement && active.type === "number") {
        active.blur();
      }
    }
    document.addEventListener("wheel", handleWheel, { passive: true });
    return () => document.removeEventListener("wheel", handleWheel);
  }, []);

  return null;
}
