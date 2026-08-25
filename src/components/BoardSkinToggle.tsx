"use client";

import { useEffect, useState } from "react";
import {
  applyBoardSkin,
  readBoardSkin,
  type BoardSkin,
} from "@/lib/board-skin";

export function BoardSkinToggle() {
  const [skin, setSkin] = useState<BoardSkin>("standard");

  useEffect(() => {
    const stored = readBoardSkin();
    setSkin(stored);
    applyBoardSkin(stored);
  }, []);

  function toggle() {
    setSkin((prev) => {
      const next: BoardSkin = prev === "kraft" ? "standard" : "kraft";
      applyBoardSkin(next);
      return next;
    });
  }

  const kraft = skin === "kraft";

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
