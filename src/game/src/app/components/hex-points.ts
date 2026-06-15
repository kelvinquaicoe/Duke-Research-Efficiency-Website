type BuildHexPointsOptions = {
  precision?: number;
};

export function buildHexPoints(
  cx: number,
  cy: number,
  radius: number,
  options: BuildHexPointsOptions = {},
): string {
  const { precision = 2 } = options;

  return Array.from({ length: 6 }, (_, i) => {
    const angle = (i * 60 - 90) * (Math.PI / 180);
    return `${(cx + radius * Math.cos(angle)).toFixed(precision)},${(
      cy + radius * Math.sin(angle)
    ).toFixed(precision)}`;
  }).join(" ");
}
