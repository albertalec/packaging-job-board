"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "nicheboard-packaging-skin";

export function BoardSkinToggle() {
  const [kraft, setKraft] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const useKraft = stored === "kraft";
    setKraft(useKraft);
    document.documentElement.dataset.boardSkin = useKraft ? "kraft" : "standard";
  }, []);

  function toggle() {
    setKraft((prev) => {
      const next = !prev;
      document.documentElement.dataset.boardSkin = next ? "kraft" : "standard";
      localStorage.setItem(STORAGE_KEY, next ? "kraft" : "standard");
      return next;
    });
  }

  return (
    <button
      type="button"
      className="board-skin-toggle"
      onClick={toggle}
      aria-pressed={kraft}
      aria-label={kraft ? "Switch to standard theme" : "Switch to kraft theme"}
    >
      <span className="board-skin-dot" aria-hidden="true" />
      <span className="board-skin-label">{kraft ? "Kraft" : "Standard"}</span>
    </button>
  );
}
