import { test, expect } from "@playwright/test";

test.describe("MathGame PWA", () => {
  test("smoke: load, mulai sesi, jawab soal, lihat progres", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /mathgame/i })).toBeVisible();

    // mulai sesi
    await page.getByRole("button", { name: /mulai latihan/i }).click();
    await expect(page.getByText(/soal 1\/10/i)).toBeVisible();

    // kartu soal muncul
    await expect(page.locator(".q-card")).toBeVisible();

    // soal pertama = warm-up dari seed bank, selalu punya visual ten-frame
    await expect(page.locator(".tenframe .dot.red").first()).toBeVisible();

    // jawab: pakai pilihan bila ada, kalau isian coba angka
    const choice = page.locator(".btn-choice").first();
    if (await choice.isVisible().catch(() => false)) {
      await choice.click();
    } else {
      await page.getByLabel("Jawaban").fill("0");
      await page.getByRole("button", { name: "Kirim" }).click();
    }

    // feedback instan muncul
    await expect(page.locator(".feedback")).toBeVisible({ timeout: 5000 });

    // lanjut ke soal 2
    await page.getByRole("button", { name: "Lanjut" }).click();
    await expect(page.getByText(/soal 2\/10/i)).toBeVisible();
  });

  test("progress tersimpan setelah reload", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem(
        "mathgame.profile.v1",
        JSON.stringify({
          v: 1,
          profile: {
            xp: 30,
            streakDays: 2,
            lastSessionDate: "2026-09-25",
            settings: { grade: 4, avatar: "kucing-oranye", theme: "senja" },
            skills: {},
          },
        }),
      );
    });
    await page.reload();
    await expect(page.getByText("Lv 1")).toBeVisible();
    // xp 30 terlihat di bar
    await expect(page.getByText(/30\/\d+ XP/)).toBeVisible();
  });

  test("manifest terkirim (installable)", async ({ page }) => {
    await page.goto("/");
    // ambil url manifest dari <link> di index (sumber kebenaran base path)
    const link = await page.locator('link[rel="manifest"]').getAttribute("href");
    expect(link).toBeTruthy();
    const resp = await page.request.get(link!);
    expect(resp.status()).toBe(200);
    const manifest = (await resp.json()) as { short_name?: string; icons?: unknown[] };
    expect(manifest.short_name).toBe("MathGame");
    expect(manifest.icons?.length ?? 0).toBeGreaterThan(0);
  });

  test("service worker menyajikan app offline", async ({ page, context }) => {
    await page.goto("/");
    // tunggu SW aktif
    await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, undefined, {
      timeout: 15_000,
    });

    // offline lalu reload → app tetap render
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole("heading", { name: /mathgame/i })).toBeVisible({ timeout: 10_000 });
    await context.setOffline(false);
  });
});
