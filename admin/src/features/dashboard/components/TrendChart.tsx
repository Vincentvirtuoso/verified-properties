import { LuChartLine } from "react-icons/lu";

const SERIES = [12, 18, 14, 22, 30, 26, 34, 28, 42, 38, 46, 52];
const LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function buildPath(points: number[], w: number, h: number) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = max - min || 1;
  return points
    .map((v, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((v - min) / span) * h;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

export function TrendChart() {
  const w = 600;
  const h = 160;
  const path = buildPath(SERIES, w, h);
  const area = `${path} L ${w} ${h} L 0 ${h} Z`;

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Signups & listings</h3>
          <p className="text-xs text-muted">Last 12 months</p>
        </div>
        <span className="grid size-9 place-items-center rounded-lg bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
          <LuChartLine size={18} />
        </span>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${w} ${h}`} className="h-40 w-full overflow-visible">
          <defs>
            <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#trend-fill)" />
          <path
            d={path}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>

        <div className="mt-2 flex justify-between text-[10px] text-muted">
          {LABELS.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
