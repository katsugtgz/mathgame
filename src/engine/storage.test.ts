import { describe, it, expect, beforeEach } from "vitest";
import { createStorage, STORAGE_KEY, SCHEMA_VERSION } from "./storage";
import type { Profile } from "./types";

// localStorage mini untuk test node
function fakeLs(): Storage {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
    key: (i: number) => [...m.keys()][i] ?? null,
    get length() {
      return m.size;
    },
  } as Storage;
}

const validProfile = (): Profile => ({
  xp: 5,
  streakDays: 1,
  lastSessionDate: "2026-09-25",
  settings: { grade: 4, avatar: "a", theme: "t" },
  skills: { "k4.x": { correctStreak: 1, failStreak: 0, mastery: 0, stage: "concrete", lastSeen: 1 } },
});

describe("storage", () => {
  let ls: Storage;
  beforeEach(() => {
    ls = fakeLs();
  });

  it("load kosong → null", () => {
    expect(createStorage(ls).load()).toBeNull();
  });

  it("save lalu load → profil sama", () => {
    const s = createStorage(ls);
    const p = validProfile();
    s.save(p);
    expect(s.load()).toEqual(p);
  });

  it("menyimpan dengan key + version envelope", () => {
    const s = createStorage(ls);
    s.save(validProfile());
    const raw = JSON.parse(ls.getItem(STORAGE_KEY)!);
    expect(raw.v).toBe(SCHEMA_VERSION);
    expect(raw.profile.xp).toBe(5);
  });

  it("versi lama/asing → null (dianggap corrupt)", () => {
    ls.setItem(STORAGE_KEY, JSON.stringify({ v: 0, profile: validProfile() }));
    expect(createStorage(ls).load()).toBeNull();
  });

  it("json rusak → null, tidak throw", () => {
    ls.setItem(STORAGE_KEY, "{not json");
    expect(createStorage(ls).load()).toBeNull();
  });

  it("profil tak lengkap → null (validasi bentuk)", () => {
    ls.setItem(STORAGE_KEY, JSON.stringify({ v: SCHEMA_VERSION, profile: { xp: 1 } }));
    expect(createStorage(ls).load()).toBeNull();
  });

  it.each([
    ["bukan object", "42"],
    ["null", "null"],
    ["xp string", { xp: "x", streakDays: 0, lastSessionDate: "", settings: { grade: 4 }, skills: {} }],
    ["streakDays hilang", { xp: 0, lastSessionDate: "", settings: { grade: 4 }, skills: {} }],
    ["lastSessionDate hilang", { xp: 0, streakDays: 0, settings: { grade: 4 }, skills: {} }],
    ["skills hilang", { xp: 0, streakDays: 0, lastSessionDate: "", settings: { grade: 4 } }],
    ["skills null", { xp: 0, streakDays: 0, lastSessionDate: "", settings: { grade: 4 }, skills: null }],
    ["settings hilang", { xp: 0, streakDays: 0, lastSessionDate: "", skills: {} }],
    ["grade hilang", { xp: 0, streakDays: 0, lastSessionDate: "", settings: {}, skills: {} }],
    ["skill state rusak", { xp: 0, streakDays: 0, lastSessionDate: "", settings: { grade: 4 }, skills: { a: { mastery: 5 } } }],
    ["skill null", { xp: 0, streakDays: 0, lastSessionDate: "", settings: { grade: 4 }, skills: { a: null } }],
    ["mastery invalid", { xp: 0, streakDays: 0, lastSessionDate: "", settings: { grade: 4 }, skills: { a: { correctStreak: 0, failStreak: 0, mastery: 9, stage: "concrete" } } }],
    ["stage hilang", { xp: 0, streakDays: 0, lastSessionDate: "", settings: { grade: 4 }, skills: { a: { correctStreak: 0, failStreak: 0, mastery: 0 } } }],
  ])("profil invalid: %s → null", (_label, bad) => {
    ls.setItem(STORAGE_KEY, JSON.stringify({ v: SCHEMA_VERSION, profile: bad }));
    expect(createStorage(ls).load()).toBeNull();
  });

  it("skill state valid diterima", () => {
    const p = validProfile();
    ls.setItem(STORAGE_KEY, JSON.stringify({ v: SCHEMA_VERSION, profile: p }));
    expect(createStorage(ls).load()).toEqual(p);
  });

  it("clear menghapus data", () => {
    const s = createStorage(ls);
    s.save(validProfile());
    s.clear();
    expect(s.load()).toBeNull();
  });

  it("storage penuh (throw) → save tidak melempar error ke pemanggil", () => {
    const throwing: Storage = {
      ...fakeLs(),
      setItem: () => {
        throw new DOMException("full", "QuotaExceededError");
      },
    };
    expect(() => createStorage(throwing).save(validProfile())).not.toThrow();
  });

  it("getItem melempar → load null, tidak throw", () => {
    const throwing: Storage = {
      ...fakeLs(),
      getItem: () => {
        throw new DOMException("blocked", "SecurityError");
      },
    };
    expect(createStorage(throwing).load()).toBeNull();
  });

  it("removeItem melempar → clear tidak throw", () => {
    const throwing: Storage = {
      ...fakeLs(),
      removeItem: () => {
        throw new DOMException("blocked", "SecurityError");
      },
    };
    expect(() => createStorage(throwing).clear()).not.toThrow();
  });
});
