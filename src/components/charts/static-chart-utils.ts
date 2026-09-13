import { roundedRectPath } from "layerchart/utils/path";

export type MovieCountDatum = {
  key: string;
  label: string;
  count: number;
  movies?: string[];
};

export type MoneyDatum = {
  key: string;
  label: string;
  budget: number;
  revenue: number;
  movieCount: number;
};

export type ChartPoint = {
  x: number;
  y: number;
};

export function getLinearTicks(maxValue: number, tickCount = 4) {
  const max = Math.max(0, maxValue);

  if (max === 0) {
    return [0];
  }

  const roughStep = max / tickCount;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalized = roughStep / magnitude;
  const step =
    normalized <= 1 ? magnitude : normalized <= 2 ? magnitude * 2 : normalized <= 5 ? magnitude * 5 : magnitude * 10;
  const roundedMax = Math.ceil(max / step) * step;
  const ticks: number[] = [];

  for (let tick = 0; tick <= roundedMax; tick += step) {
    ticks.push(tick);
  }

  return ticks;
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: 0,
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function shouldShowXAxisLabel(index: number, itemCount: number) {
  if (itemCount <= 10) {
    return true;
  }

  if (index === 0 || index === itemCount - 1) {
    return true;
  }

  return index % Math.ceil(itemCount / 6) === 0;
}

export function getPath(points: ChartPoint[]) {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");
}

export function getRoundedBarPath(x: number, y: number, width: number, height: number, radius = 2) {
  if (width <= 0 || height <= 0) {
    return "";
  }

  const safeRadius = Math.min(radius, width / 2, height / 2);

  return roundedRectPath(x, y, width, height, [safeRadius, safeRadius, 0, 0]);
}
