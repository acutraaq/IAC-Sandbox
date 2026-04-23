interface LogoProps {
  size?: "sm" | "md" | "lg";
}

const configs = {
  sm: { dim: 20, padding: 5,  dotR: 1.5, strokeW: 1   },
  md: { dim: 32, padding: 8,  dotR: 2,   strokeW: 1.5 },
  lg: { dim: 48, padding: 12, dotR: 3,   strokeW: 2   },
};

export function Logo({ size = "md" }: LogoProps) {
  const { dim, padding, dotR, strokeW } = configs[size];
  const step = (dim - 2 * padding) / 2;

  const dots: { cx: number; cy: number }[] = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      dots.push({ cx: padding + col * step, cy: padding + row * step });
    }
  }

  return (
    <svg
      width={dim}
      height={dim}
      viewBox={`0 0 ${dim} ${dim}`}
      fill="none"
      aria-hidden="true"
    >
      <rect
        x={strokeW / 2}
        y={strokeW / 2}
        width={dim - strokeW}
        height={dim - strokeW}
        rx={4}
        stroke="var(--color-accent)"
        strokeWidth={strokeW}
      />
      {dots.map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r={dotR} fill="var(--color-accent)" />
      ))}
    </svg>
  );
}
