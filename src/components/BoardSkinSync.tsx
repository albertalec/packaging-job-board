"use client";

import { useEffect } from "react";
import { applyBoardSkin, readBoardSkin } from "@/lib/board-skin";

/** Restores saved skin on pages that do not render the toggle. */
export function BoardSkinSync() {
  useEffect(() => {
    applyBoardSkin(readBoardSkin());
  }, []);

  return null;
}
