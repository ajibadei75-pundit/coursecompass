import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Check } from "lucide-react";

type Props = {
  disabled?: boolean;
  busy?: boolean;
  label?: string;
  busyLabel?: string;
  onComplete: () => void;
};

/**
 * Drag-the-rope control: pull the handle across the track toward "Analyze".
 * A slack rope follows the handle and tightens as you approach the target.
 */
export function DragAnalyze({
  disabled = false,
  busy = false,
  label = "Drag to Analyze",
  busyLabel = "Analyzing",
  onComplete,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [x, setX] = useState(0); // px offset of the handle
  const [max, setMax] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [done, setDone] = useState(false);

  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setMax(Math.max(0, el.clientWidth - 56 - 8));
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  useEffect(() => {
    if (!busy && done) {
      setDone(false);
      setX(0);
    }
  }, [busy, done]);

  const progress = max > 0 ? Math.min(1, x / max) : 0;

  const finish = useCallback(() => {
    setDone(true);
    setX(max);
    onComplete();
  }, [max, onComplete]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled || busy || done) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const next = Math.min(max, Math.max(0, e.clientX - rect.left - 32));
    setX(next);
  };

  const endDrag = () => {
    if (!dragging) return;
    setDragging(false);
    if (max > 0 && x / max >= 0.92) finish();
    else setX(0);
  };

  // Rope geometry: sag decreases as the rope is pulled tight.
  const ropeStart = 28;
  const ropeEnd = Math.max(ropeStart, x + 28);
  const sag = (1 - progress) * 16 + 2;
  const path = `M ${ropeStart} 28 Q ${(ropeStart + ropeEnd) / 2} ${28 + sag} ${ropeEnd} 28`;

  return (
    <div
      ref={trackRef}
      className={`relative h-14 w-full select-none overflow-hidden rounded-xl glass ${
        disabled ? "opacity-60" : ""
      }`}
    >
      {/* filled progress */}
      <div
        className="absolute inset-y-0 left-0 bg-primary/15"
        style={{
          width: `${progress * 100}%`,
          transition: dragging ? "none" : "width 320ms cubic-bezier(.22,1,.36,1)",
        }}
      />

      {/* target label */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span
          className="text-sm font-medium tracking-wide"
          style={{ color: `color-mix(in oklab, var(--primary) ${40 + progress * 60}%, var(--muted-foreground))` }}
        >
          {busy ? busyLabel : done ? "Analyze" : label}
        </span>
      </div>

      {/* rope */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
        <path
          d={path}
          fill="none"
          stroke="color-mix(in oklab, var(--primary) 45%, transparent)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray="1 6"
        />
      </svg>

      {/* handle */}
      <button
        type="button"
        aria-label={label}
        disabled={disabled || busy}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            finish();
          }
        }}
        className={`absolute top-1 left-1 flex size-12 touch-none items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg ${
          dragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{
          transform: `translateX(${x}px)`,
          transition: dragging ? "none" : "transform 320ms cubic-bezier(.22,1,.36,1)",
        }}
      >
        {busy || done ? <Check className="size-5" /> : <ArrowRight className="size-5" />}
      </button>
    </div>
  );
}
