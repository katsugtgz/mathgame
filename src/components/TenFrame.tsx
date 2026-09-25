import type { CpaStage } from "../engine/types";

/** Badge stage CPA: Concrete / Pictorial / Abstract. */
export function StageBadge({ stage }: { stage: CpaStage }) {
  const label = stage === "concrete" ? "Nyata" : stage === "pictorial" ? "Gambar" : "Angka";
  return (
    <span className={`badge badge-${stage}`} aria-label={`Tingkat soal: ${label}`}>
      {label}
    </span>
  );
}

type TenFrameProps = { visual: string };

/**
 * Render visual ten-frame terenkode "tenframe:2x5:rr..bb".
 * r = titik merah (positif), b = biru (negatif), . = kosong —
 * dari kartu belajar: kotak 10 + counter bulat.
 */
export function TenFrame({ visual }: TenFrameProps) {
  const [, dims, cells] = visual.split(":");
  const [rows, cols] = dims.split("x").map(Number);
  if (!rows || !cols || !cells || cells.length !== rows * cols) return null;
  const dotCount = [...cells].filter((c) => c === "r" || c === "b").length;
  return (
    <div
      className="tenframe"
      role="img"
      aria-label={`Gambar bantu: ${dotCount} titik`}
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {[...cells].map((c, i) => (
        <span key={i} className={`cell ${c === "r" ? "red" : c === "b" ? "blue" : ""}`}>
          {c === "r" ? <span className="dot red" /> : c === "b" ? <span className="dot blue" /> : null}
        </span>
      ))}
    </div>
  );
}
