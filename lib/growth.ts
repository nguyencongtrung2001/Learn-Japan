export const MAX_GROWTH_LEVEL = 6;

const GROWTH_ICONS = ["🌰", "🌱", "🪴", "☘️", "🌿", "🌷", "🌺"] as const;

export function growthIcon(level: number): string {
  return GROWTH_ICONS[Math.min(Math.max(level, 0), MAX_GROWTH_LEVEL)];
}
