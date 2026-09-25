import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { TenFrame } from "./TenFrame";

describe("TenFrame", () => {
  it("format benar: 2x5, 7 titik", () => {
    const { container } = render(<TenFrame visual="tenframe:2x5:rrrrrrr..." />);
    const img = container.querySelector(".tenframe")!;
    expect(img.getAttribute("aria-label")).toBe("Gambar bantu: 7 titik");
    expect(img.querySelectorAll(".dot.red")).toHaveLength(7);
    expect(img.querySelectorAll(".cell")).toHaveLength(10);
  });

  it("counter biru dihitung", () => {
    const { container } = render(<TenFrame visual="tenframe:2x2:rrbb" />);
    const img = container.querySelector(".tenframe")!;
    expect(img.getAttribute("aria-label")).toBe("Gambar bantu: 4 titik");
    expect(img.querySelectorAll(".dot.blue")).toHaveLength(2);
  });

  it("sel kosong tanpa dot", () => {
    const { container } = render(<TenFrame visual="tenframe:1x3:r.." />);
    const img = container.querySelector(".tenframe")!;
    expect(img.querySelectorAll(".dot")).toHaveLength(1);
    expect(img.querySelectorAll(".cell")).toHaveLength(3);
  });

  it("format rusak → tidak render", () => {
    const { container } = render(<TenFrame visual="tenframe:2x5:rr" />);
    expect(container.querySelector(".tenframe")).toBeNull();
  });
});
