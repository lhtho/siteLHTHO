import { useState, useRef, useEffect } from "react";

// ========================
// TYPES
// ========================
interface Solution {
  type: "two_real" | "one_real" | "complex" | "linear" | "identity" | "no_solution";
  x1?: number | string;
  x2?: number | string;
  x1Real?: number;
  x1Imag?: number;
  x2Real?: number;
  x2Imag?: number;
  delta?: number;
  vertex?: { x: number; y: number };
  steps: Step[];
}

interface Step {
  label: string;
  formula: string;
  value: string;
  highlight?: boolean;
}

// ========================
// MATH ENGINE
// ========================
function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

function formatFraction(num: number, den: number): string {
  if (den === 0) return "∞";
  if (num === 0) return "0";
  const sign = (num < 0) !== (den < 0) ? "-" : "";
  num = Math.abs(num);
  den = Math.abs(den);
  const g = gcd(num, den);
  const n = num / g;
  const d = den / g;
  return d === 1 ? `${sign}${n}` : `${sign}${n}/${d}`;
}

function formatNum(n: number, decimals = 4): string {
  if (Number.isInteger(n)) return String(n);
  const fixed = parseFloat(n.toFixed(decimals));
  return String(fixed);
}

function solve(a: number, b: number, c: number): Solution {
  // Trường hợp đặc biệt: a = 0
  if (a === 0) {
    if (b === 0) {
      if (c === 0) return { type: "identity", steps: [] };
      return { type: "no_solution", steps: [] };
    }
    // Phương trình bậc 1: bx + c = 0
    const x = -c / b;
    return {
      type: "linear",
      x1: x,
      steps: [
        { label: "Phương trình bậc 1", formula: `${b}x + (${c}) = 0`, value: "" },
        { label: "Nghiệm", formula: `x = -c / b`, value: `x = ${formatFraction(-c, b)} ≈ ${formatNum(x)}` },
      ],
    };
  }

  const delta = b * b - 4 * a * c;
  const vertex = { x: -b / (2 * a), y: c - (b * b) / (4 * a) };

  const baseSteps: Step[] = [
    {
      label: "Bước 1 – Xác định hệ số",
      formula: "ax² + bx + c = 0",
      value: `a = ${a},  b = ${b},  c = ${c}`,
    },
    {
      label: "Bước 2 – Tính Delta (Δ)",
      formula: "Δ = b² – 4ac",
      value: `Δ = (${b})² – 4×(${a})×(${c}) = ${b * b} – ${4 * a * c} = ${delta}`,
      highlight: true,
    },
    {
      label: "Bước 3 – Đỉnh parabol",
      formula: "V(−b/2a ; c − b²/4a)",
      value: `V(${formatNum(vertex.x, 3)} ; ${formatNum(vertex.y, 3)})`,
    },
  ];

  if (delta > 0) {
    const sqrtDelta = Math.sqrt(delta);
    const x1 = (-b - sqrtDelta) / (2 * a);
    const x2 = (-b + sqrtDelta) / (2 * a);
    return {
      type: "two_real",
      x1,
      x2,
      delta,
      vertex,
      steps: [
        ...baseSteps,
        {
          label: "Bước 4 – Δ > 0 → Hai nghiệm thực phân biệt",
          formula: "x₁ = (−b − √Δ) / 2a,  x₂ = (−b + √Δ) / 2a",
          value: `√Δ = √${delta} ≈ ${formatNum(sqrtDelta)}`,
        },
        {
          label: "Kết quả",
          formula: "",
          value: `x₁ = ${formatNum(x1, 6)}\nx₂ = ${formatNum(x2, 6)}`,
          highlight: true,
        },
      ],
    };
  } else if (delta === 0) {
    const x0 = -b / (2 * a);
    return {
      type: "one_real",
      x1: x0,
      x2: x0,
      delta,
      vertex,
      steps: [
        ...baseSteps,
        {
          label: "Bước 4 – Δ = 0 → Nghiệm kép",
          formula: "x₁ = x₂ = −b / 2a",
          value: `x₁ = x₂ = ${formatFraction(-b, 2 * a)} ≈ ${formatNum(x0)}`,
          highlight: true,
        },
      ],
    };
  } else {
    // Delta < 0 → nghiệm phức
    const real = -b / (2 * a);
    const imag = Math.sqrt(-delta) / (2 * a);
    return {
      type: "complex",
      x1Real: real,
      x1Imag: -imag,
      x2Real: real,
      x2Imag: imag,
      delta,
      vertex,
      steps: [
        ...baseSteps,
        {
          label: "Bước 4 – Δ < 0 → Hai nghiệm phức liên hợp",
          formula: "x = (−b ± i√|Δ|) / 2a",
          value: `√|Δ| = √${-delta} ≈ ${formatNum(Math.sqrt(-delta))}`,
        },
        {
          label: "Kết quả (nghiệm phức)",
          formula: "",
          value: `x₁ = ${formatNum(real, 4)} − ${formatNum(imag, 4)}i\nx₂ = ${formatNum(real, 4)} + ${formatNum(imag, 4)}i`,
          highlight: true,
        },
      ],
    };
  }
}

// ========================
// PARABOLA CANVAS
// ========================
function ParabolaChart({ a, b, c, solution }: { a: number; b: number; c: number; solution: Solution | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    // Clear
    ctx.clearRect(0, 0, W, H);

    // Background
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#0f172a");
    bg.addColorStop(1, "#1e1b4b");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    if (a === 0) return;

    // Determine range
    const vertex = { x: -b / (2 * a), y: c - (b * b) / (4 * a) };
    const margin = Math.max(4, Math.abs(vertex.x) + 3);
    const xMin = vertex.x - margin;
    const xMax = vertex.x + margin;

    const yValues: number[] = [];
    for (let xi = xMin; xi <= xMax; xi += (xMax - xMin) / 100) {
      yValues.push(a * xi * xi + b * xi + c);
    }
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);
    const yRange = Math.max(yMax - yMin, 1);
    const yPad = yRange * 0.2;

    const toCanvas = (xw: number, yw: number) => ({
      x: ((xw - xMin) / (xMax - xMin)) * W,
      y: H - ((yw - (yMin - yPad)) / (yRange + 2 * yPad)) * H,
    });

    // Grid lines
    ctx.strokeStyle = "rgba(99,102,241,0.12)";
    ctx.lineWidth = 1;
    for (let i = Math.ceil(xMin); i <= Math.floor(xMax); i++) {
      const p0 = toCanvas(i, yMin - yPad);
      const p1 = toCanvas(i, yMax + yPad);
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    }

    // Axes
    const origin = toCanvas(0, 0);
    ctx.strokeStyle = "rgba(148,163,184,0.4)";
    ctx.lineWidth = 1.5;
    // X axis
    ctx.beginPath();
    ctx.moveTo(0, origin.y);
    ctx.lineTo(W, origin.y);
    ctx.stroke();
    // Y axis
    ctx.beginPath();
    ctx.moveTo(origin.x, 0);
    ctx.lineTo(origin.x, H);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = "rgba(148,163,184,0.6)";
    ctx.font = "11px Inter, sans-serif";
    for (let i = Math.ceil(xMin); i <= Math.floor(xMax); i++) {
      if (i === 0) continue;
      const p = toCanvas(i, 0);
      ctx.fillText(String(i), p.x - 4, p.y + 14);
    }

    // Parabola gradient
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#818cf8");
    grad.addColorStop(0.5, "#a78bfa");
    grad.addColorStop(1, "#c084fc");

    ctx.beginPath();
    ctx.strokeStyle = grad;
    ctx.lineWidth = 3;
    ctx.shadowColor = "#818cf8";
    ctx.shadowBlur = 12;

    let first = true;
    const steps = 300;
    for (let i = 0; i <= steps; i++) {
      const xw = xMin + (i / steps) * (xMax - xMin);
      const yw = a * xw * xw + b * xw + c;
      const p = toCanvas(xw, yw);
      if (first) { ctx.moveTo(p.x, p.y); first = false; }
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Roots
    if (solution && (solution.type === "two_real" || solution.type === "one_real")) {
      const roots = solution.type === "two_real"
        ? [Number(solution.x1), Number(solution.x2)]
        : [Number(solution.x1)];

      roots.forEach((rx) => {
        const rp = toCanvas(rx, 0);
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = "#34d399";
        ctx.shadowColor = "#34d399";
        ctx.shadowBlur = 16;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#ecfdf5";
        ctx.font = "bold 10px Inter";
        ctx.fillText(`x=${formatNum(rx, 2)}`, rp.x + 10, rp.y - 8);
      });
    }

    // Vertex
    const vp = toCanvas(vertex.x, vertex.y);
    ctx.beginPath();
    ctx.arc(vp.x, vp.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#fbbf24";
    ctx.shadowColor = "#fbbf24";
    ctx.shadowBlur = 14;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#fef3c7";
    ctx.font = "bold 10px Inter";
    ctx.fillText(`V(${formatNum(vertex.x, 2)};${formatNum(vertex.y, 2)})`, vp.x + 10, vp.y - 8);

  }, [a, b, c, solution]);

  return (
    <canvas
      ref={canvasRef}
      width={440}
      height={260}
      className="w-full rounded-2xl"
      style={{ background: "transparent" }}
    />
  );
}

// ========================
// NUMBER INPUT
// ========================
function CoeffInput({
  label,
  sub,
  value,
  onChange,
  color,
}: {
  label: string;
  sub: string;
  value: string;
  onChange: (v: string) => void;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <label className="text-xs font-semibold tracking-widest uppercase" style={{ color }}>
        {label}
        <sub className="text-[10px]">{sub}</sub>
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        step="any"
        className="w-24 h-14 text-center text-xl font-bold rounded-2xl border-2 outline-none transition-all duration-200 bg-white/5 text-white placeholder-white/30"
        style={{
          borderColor: value !== "" && value !== "-" ? color : "rgba(255,255,255,0.1)",
          boxShadow: value !== "" && value !== "-" ? `0 0 16px ${color}40` : "none",
          fontFamily: "JetBrains Mono, monospace",
        }}
        placeholder="0"
      />
    </div>
  );
}

// ========================
// BADGE
// ========================
function DeltaBadge({ delta }: { delta: number }) {
  const isPos = delta > 0;
  const isZero = delta === 0;
  const color = isPos ? "#34d399" : isZero ? "#fbbf24" : "#f87171";
  const label = isPos ? "Δ > 0" : isZero ? "Δ = 0" : "Δ < 0";
  const desc = isPos ? "Hai nghiệm thực" : isZero ? "Nghiệm kép" : "Nghiệm phức";

  return (
    <div
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm"
      style={{
        background: `${color}18`,
        border: `1.5px solid ${color}55`,
        color,
        boxShadow: `0 0 20px ${color}30`,
      }}
    >
      <span className="text-base">{label}</span>
      <span className="opacity-70 font-normal">·</span>
      <span className="font-normal opacity-80">{desc}</span>
    </div>
  );
}

// ========================
// STEP CARD
// ========================
function StepCard({ step, index }: { step: Step; index: number }) {
  return (
    <div
      className="rounded-2xl p-4 border transition-all duration-300"
      style={{
        background: step.highlight
          ? "linear-gradient(135deg, rgba(129,140,248,0.15), rgba(167,139,250,0.15))"
          : "rgba(255,255,255,0.03)",
        borderColor: step.highlight ? "rgba(129,140,248,0.4)" : "rgba(255,255,255,0.06)",
        boxShadow: step.highlight ? "0 0 24px rgba(129,140,248,0.15)" : "none",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
          style={{
            background: step.highlight
              ? "linear-gradient(135deg, #818cf8, #a78bfa)"
              : "rgba(255,255,255,0.08)",
            color: step.highlight ? "white" : "rgba(255,255,255,0.4)",
          }}
        >
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-white/50 font-medium mb-1">{step.label}</p>
          {step.formula && (
            <p
              className="text-sm mb-1 font-mono"
              style={{ color: "#a5b4fc", fontFamily: "JetBrains Mono, monospace" }}
            >
              {step.formula}
            </p>
          )}
          <p
            className="text-sm font-semibold whitespace-pre-line"
            style={{
              color: step.highlight ? "#e0e7ff" : "rgba(255,255,255,0.75)",
              fontFamily: "JetBrains Mono, monospace",
            }}
          >
            {step.value}
          </p>
        </div>
      </div>
    </div>
  );
}

// ========================
// RESULT CARD
// ========================
function ResultCard({ solution }: { solution: Solution }) {
  const cards: { label: string; value: string; color: string }[] = [];

  if (solution.type === "two_real") {
    cards.push(
      { label: "Nghiệm x₁", value: formatNum(Number(solution.x1), 6), color: "#34d399" },
      { label: "Nghiệm x₂", value: formatNum(Number(solution.x2), 6), color: "#818cf8" }
    );
  } else if (solution.type === "one_real") {
    cards.push({ label: "Nghiệm kép x₁ = x₂", value: formatNum(Number(solution.x1), 6), color: "#fbbf24" });
  } else if (solution.type === "complex") {
    const r = solution.x1Real!;
    const i = Math.abs(solution.x2Imag!);
    cards.push(
      { label: "Nghiệm x₁", value: `${formatNum(r, 4)} − ${formatNum(i, 4)}i`, color: "#f472b6" },
      { label: "Nghiệm x₂", value: `${formatNum(r, 4)} + ${formatNum(i, 4)}i`, color: "#c084fc" }
    );
  } else if (solution.type === "linear") {
    cards.push({ label: "Nghiệm x", value: formatNum(Number(solution.x1), 6), color: "#34d399" });
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {cards.map((card, i) => (
        <div
          key={i}
          className="rounded-2xl p-5 flex flex-col gap-1 border"
          style={{
            background: `${card.color}12`,
            borderColor: `${card.color}40`,
            boxShadow: `0 0 30px ${card.color}20`,
          }}
        >
          <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: card.color + "bb" }}>
            {card.label}
          </span>
          <span
            className="text-2xl font-bold tracking-tight"
            style={{ color: card.color, fontFamily: "JetBrains Mono, monospace" }}
          >
            {card.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ========================
// EXAMPLE PRESETS
// ========================
const PRESETS = [
  { label: "x² − 5x + 6", a: 1, b: -5, c: 6, emoji: "✨" },
  { label: "2x² + 3x − 2", a: 2, b: 3, c: -2, emoji: "📐" },
  { label: "x² − 2x + 1", a: 1, b: -2, c: 1, emoji: "⭐" },
  { label: "x² + x + 1", a: 1, b: 1, c: 1, emoji: "🔮" },
  { label: "x² − 4", a: 1, b: 0, c: -4, emoji: "🎯" },
];

// ========================
// MAIN APP
// ========================
export default function App() {
  const [aVal, setAVal] = useState("1");
  const [bVal, setBVal] = useState("-5");
  const [cVal, setCVal] = useState("6");
  const [solution, setSolution] = useState<Solution | null>(null);
  const [showSteps, setShowSteps] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [showChart, setShowChart] = useState(false);

  const a = parseFloat(aVal) || 0;
  const b = parseFloat(bVal) || 0;
  const c = parseFloat(cVal) || 0;

  const handleSolve = () => {
    const result = solve(a, b, c);
    setSolution(result);
    setShowSteps(false);
    setAnimKey((k) => k + 1);
    setTimeout(() => setShowSteps(true), 100);
  };

  const handlePreset = (preset: (typeof PRESETS)[0]) => {
    setAVal(String(preset.a));
    setBVal(String(preset.b));
    setCVal(String(preset.c));
    setSolution(null);
    setShowSteps(false);
  };

  const handleReset = () => {
    setAVal("");
    setBVal("");
    setCVal("");
    setSolution(null);
    setShowSteps(false);
    setShowChart(false);
  };

  const equationDisplay = () => {
    const fmt = (coef: number, varPart: string, isFirst = false) => {
      if (coef === 0) return "";
      const abs = Math.abs(coef);
      const sign = coef < 0 ? " − " : isFirst ? "" : " + ";
      const num = abs === 1 && varPart ? "" : String(abs);
      return `${isFirst && coef > 0 ? "" : sign}${num}${varPart}`;
    };
    const parts = [
      fmt(a, "x²", true),
      fmt(b, "x"),
      fmt(c, ""),
    ].filter(Boolean);
    return parts.length ? parts.join("") + " = 0" : "0 = 0";
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-start py-10 px-4"
      style={{
        background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* HEADER */}
      <div className="w-full max-w-2xl mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
            style={{
              background: "linear-gradient(135deg, #818cf8, #a78bfa, #c084fc)",
              boxShadow: "0 0 30px rgba(129,140,248,0.5)",
            }}
          >
            𝑥²
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-black text-white tracking-tight leading-none">
              QuadSolver <span style={{ color: "#a78bfa" }}>Pro</span>
            </h1>
            <p className="text-xs text-white/40 font-medium tracking-wider">PHƯƠNG TRÌNH BẬC HAI · QUADRATIC EQUATION</p>
          </div>
        </div>
        <p className="text-white/40 text-sm">
          Nhập hệ số → Giải ngay → Xem từng bước chi tiết & đồ thị parabol
        </p>
      </div>

      {/* MAIN CARD */}
      <div
        className="w-full max-w-2xl rounded-3xl p-6 sm:p-8 mb-6"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
        }}
      >
        {/* Equation Preview */}
        <div
          className="rounded-2xl p-4 mb-6 text-center"
          style={{
            background: "rgba(129,140,248,0.08)",
            border: "1px solid rgba(129,140,248,0.2)",
          }}
        >
          <p className="text-xs text-white/40 mb-1 font-medium tracking-wider uppercase">Phương trình</p>
          <p
            className="text-2xl font-bold text-white tracking-tight"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            {equationDisplay()}
          </p>
        </div>

        {/* Coefficients */}
        <div className="flex justify-center gap-4 sm:gap-8 mb-6">
          <CoeffInput label="a" sub="" value={aVal} onChange={setAVal} color="#818cf8" />
          <div className="flex items-end pb-4 text-white/20 text-2xl font-bold">·</div>
          <CoeffInput label="b" sub="" value={bVal} onChange={setBVal} color="#a78bfa" />
          <div className="flex items-end pb-4 text-white/20 text-2xl font-bold">·</div>
          <CoeffInput label="c" sub="" value={cVal} onChange={setCVal} color="#c084fc" />
        </div>

        {/* Presets */}
        <div className="mb-6">
          <p className="text-xs text-white/30 font-semibold tracking-wider uppercase mb-2 text-center">Ví dụ nhanh</p>
          <div className="flex flex-wrap justify-center gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => handlePreset(p)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 hover:scale-105"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                {p.emoji} {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSolve}
            className="flex-1 py-4 rounded-2xl font-bold text-base text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)",
              boxShadow: "0 8px 32px rgba(139,92,246,0.4)",
            }}
          >
            ⚡ Giải Ngay
          </button>
          <button
            onClick={handleReset}
            className="px-5 py-4 rounded-2xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02]"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            🔄 Reset
          </button>
        </div>
      </div>

      {/* SOLUTION */}
      {solution && (
        <div
          key={animKey}
          className="w-full max-w-2xl rounded-3xl p-6 sm:p-8 mb-6"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 40px 80px rgba(0,0,0,0.4)",
            animation: "fadeSlideUp 0.4s cubic-bezier(0.16,1,0.3,1) forwards",
          }}
        >
          {/* Delta Badge */}
          {solution.delta !== undefined && (
            <div className="flex justify-center mb-5">
              <DeltaBadge delta={solution.delta} />
            </div>
          )}

          {/* Special Cases */}
          {solution.type === "identity" && (
            <div className="text-center py-6">
              <p className="text-4xl mb-3">∞</p>
              <p className="text-white font-bold text-lg">Phương trình nghiệm đúng với mọi x</p>
              <p className="text-white/40 text-sm mt-1">a = b = c = 0</p>
            </div>
          )}
          {solution.type === "no_solution" && (
            <div className="text-center py-6">
              <p className="text-4xl mb-3">∅</p>
              <p className="text-white font-bold text-lg">Phương trình vô nghiệm</p>
              <p className="text-white/40 text-sm mt-1">a = 0, b = 0, c ≠ 0</p>
            </div>
          )}

          {/* Result Cards */}
          {solution.type !== "identity" && solution.type !== "no_solution" && (
            <div className="mb-5">
              <ResultCard solution={solution} />
            </div>
          )}

          {/* Toggle Steps */}
          {solution.steps.length > 0 && (
            <button
              onClick={() => setShowSteps((s) => !s)}
              className="w-full py-3 rounded-2xl font-semibold text-sm transition-all duration-200 mb-4 flex items-center justify-center gap-2"
              style={{
                background: showSteps ? "rgba(129,140,248,0.15)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${showSteps ? "rgba(129,140,248,0.3)" : "rgba(255,255,255,0.08)"}`,
                color: showSteps ? "#a5b4fc" : "rgba(255,255,255,0.45)",
              }}
            >
              <span>{showSteps ? "▲" : "▼"}</span>
              {showSteps ? "Ẩn bước giải" : "📖 Xem từng bước giải chi tiết"}
            </button>
          )}

          {/* Steps */}
          {showSteps && solution.steps.length > 0 && (
            <div className="flex flex-col gap-3 mb-5">
              {solution.steps.map((step, i) => (
                <StepCard key={i} step={step} index={i} />
              ))}
            </div>
          )}

          {/* Toggle Chart */}
          <button
            onClick={() => setShowChart((s) => !s)}
            className="w-full py-3 rounded-2xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2"
            style={{
              background: showChart ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${showChart ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.08)"}`,
              color: showChart ? "#34d399" : "rgba(255,255,255,0.45)",
            }}
          >
            <span>{showChart ? "▲" : "▼"}</span>
            {showChart ? "Ẩn đồ thị" : "📊 Xem đồ thị Parabol"}
          </button>

          {showChart && (
            <div
              className="mt-4 rounded-2xl overflow-hidden border"
              style={{ borderColor: "rgba(52,211,153,0.2)" }}
            >
              <ParabolaChart a={a} b={b} c={c} solution={solution} />
              <div className="px-4 py-3 flex flex-wrap gap-4 text-xs text-white/40">
                <span>
                  <span style={{ color: "#818cf8" }}>●</span> Parabol y = {aVal}x² {bVal !== "" ? `${Number(bVal) >= 0 ? "+" : ""}${bVal}x` : ""}{" "}
                  {cVal !== "" ? `${Number(cVal) >= 0 ? "+" : ""}${cVal}` : ""}
                </span>
                <span>
                  <span style={{ color: "#34d399" }}>●</span> Nghiệm thực
                </span>
                <span>
                  <span style={{ color: "#fbbf24" }}>●</span> Đỉnh V
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* INFO CARDS */}
      <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          {
            icon: "📌",
            title: "Công thức Delta",
            desc: "Δ = b² − 4ac · Phân biệt 3 trường hợp nghiệm",
            color: "#818cf8",
          },
          {
            icon: "🧠",
            title: "Nghiệm phức",
            desc: "Δ < 0 → nghiệm trong tập số phức ℂ",
            color: "#f472b6",
          },
          {
            icon: "📈",
            title: "Đồ thị Parabol",
            desc: "Hướng mở lên khi a > 0, mở xuống khi a < 0",
            color: "#34d399",
          },
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-2xl p-4 border"
            style={{
              background: `${card.color}08`,
              borderColor: `${card.color}25`,
            }}
          >
            <p className="text-2xl mb-2">{card.icon}</p>
            <p className="font-bold text-sm text-white mb-1">{card.title}</p>
            <p className="text-xs text-white/40">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <p className="text-white/20 text-xs text-center">
        QuadSolver Pro · Giải phương trình bậc hai ax² + bx + c = 0 · Hỗ trợ nghiệm thực & phức
      </p>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
