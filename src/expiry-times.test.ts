// @vitest-environment jsdom
import en from "../fixtures/en.html?raw";
import ja from "../fixtures/ja.html?raw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { observeExpiryTimes, updateExpiryTimes } from "./expiry-times";

let stop: (() => void) | undefined;
beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  stop?.();
  stop = undefined;
  vi.useRealTimers();
  document.body.innerHTML = "";
});
const settle = async () => {
  await Promise.resolve();
  vi.advanceTimersToNextFrame();
};
const times = () =>
  [...document.querySelectorAll("[data-bre-time]")].map((span) =>
    span.getAttribute("data-bre-time"),
  );

describe("expiry time display", () => {
  it.each([
    ["en", ["1:19 PM GMT+9", "5:44 AM GMT+9", "4:00 AM GMT+9"]],
    ["ja", ["13:19 JST", "5:41 JST", "3:58 JST"]],
  ])("preserves %s dates and DOM children on repeated updates", (language, expected) => {
    document.body.innerHTML = language === "en" ? en : ja;
    const span = document.querySelector("span[title]")!;
    const text = span.textContent;
    const child = span.firstChild;
    updateExpiryTimes(document);
    updateExpiryTimes(document);
    expect(times()).toEqual(expected);
    expect(span.textContent).toBe(text);
    expect(span.firstChild).toBe(child);
  });

  it("handles multiple description IDs, fallback titles and unrelated buttons", () => {
    document.body.innerHTML = en;
    const button = document.querySelector('[role="tabpanel"] button')!;
    const span = document.querySelector("span[title]")!;
    button.setAttribute("aria-describedby", `missing ${span.id} extra`);
    span.setAttribute("title", "Expires at 13:19 (Japan Standard Time)");
    document.body.insertAdjacentHTML(
      "beforeend",
      '<span id="outside" title="Expires 12:34 UTC">Elsewhere</span><button aria-describedby="outside">Unrelated</button>',
    );
    const panel = document.querySelector('[role="tabpanel"]')!;
    panel.insertAdjacentHTML(
      "beforeend",
      '<span id="date-only" title="Expires October 5">Date only</span><button aria-describedby="date-only outside">No time</button>',
    );
    updateExpiryTimes(document);
    expect(span.getAttribute("data-bre-time")).toBe("Expires at 13:19 (Japan Standard Time)");
    expect(document.getElementById("outside")!.hasAttribute("data-bre-time")).toBe(false);
    expect(document.getElementById("date-only")!.hasAttribute("data-bre-time")).toBe(false);
  });

  it("tracks SPA insertion, replacement, title changes, tab changes and removed references", async () => {
    stop = observeExpiryTimes(document);
    expect(times()).toEqual([]);
    document.body.innerHTML = ja;
    await settle();
    expect(times()).toEqual(["13:19 JST", "5:41 JST", "3:58 JST"]);
    const panel = document.querySelector('[role="tabpanel"]')!;
    const original = panel.innerHTML;
    panel.innerHTML = original.replaceAll('data-bre-time="13:19 JST"', "");
    await settle();
    expect(times()).toEqual(["13:19 JST", "5:41 JST", "3:58 JST"]);
    panel.innerHTML = original;
    panel.setAttribute("hidden", "");
    await settle();
    expect(times()).toEqual(["13:19 JST", "5:41 JST", "3:58 JST"]);
    panel.removeAttribute("hidden");
    const span = panel.querySelector("span[title]")!;
    span.setAttribute("title", "有効期限: 10/5 14:20 JST");
    await settle();
    expect(span.getAttribute("data-bre-time")).toBe("14:20 JST");
    span.removeAttribute("title");
    await settle();
    expect(span.hasAttribute("data-bre-time")).toBe(false);
    span.setAttribute("title", "有効期限: 10/5 15:00 JST");
    await settle();
    expect(span.getAttribute("data-bre-time")).toBe("15:00 JST");
    panel.querySelector("button")!.removeAttribute("aria-describedby");
    await settle();
    expect(span.hasAttribute("data-bre-time")).toBe(false);
    document.body.innerHTML = "<p>Chat screen</p>";
    await settle();
    expect(times()).toEqual([]);
  });
});
