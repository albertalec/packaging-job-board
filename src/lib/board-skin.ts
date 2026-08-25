export const BOARD_SKIN_STORAGE_KEY = "nicheboard-packaging-skin";

export type BoardSkin = "standard" | "kraft";

export function readBoardSkin(): BoardSkin {
  if (typeof window === "undefined") return "standard";
  return localStorage.getItem(BOARD_SKIN_STORAGE_KEY) === "kraft"
    ? "kraft"
    : "standard";
}

export function applyBoardSkin(skin: BoardSkin) {
  document.documentElement.dataset.boardSkin = skin;
  localStorage.setItem(BOARD_SKIN_STORAGE_KEY, skin);
}
