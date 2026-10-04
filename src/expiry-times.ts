const clock = /\d{1,2}:\d{2}/;
const timeSuffix = /(\d{1,2}:\d{2}(?:\s?[AP]M)?(?:\s+\S+)?)\s*$/;

export function updateExpiryTimes(document: Document): void {
  const targets = new Map<Element, string>();

  for (const tab of document.querySelectorAll('[role="tablist"] [aria-controls]')) {
    for (const panelId of tab.getAttribute("aria-controls")!.split(/\s+/)) {
      const panel = document.getElementById(panelId);
      if (panel?.getAttribute("role") !== "tabpanel") continue;

      for (const button of panel.querySelectorAll("button[aria-describedby]")) {
        for (const id of button.getAttribute("aria-describedby")!.split(/\s+/)) {
          const span = document.getElementById(id);
          const title = span?.getAttribute("title");
          if (span?.tagName !== "SPAN" || !panel.contains(span) || !title || !clock.test(title))
            continue;
          targets.set(span, title.match(timeSuffix)?.[1] ?? title);
        }
      }
    }
  }

  for (const span of document.querySelectorAll("[data-bre-time]")) {
    if (!targets.has(span)) span.removeAttribute("data-bre-time");
  }
  for (const [span, time] of targets) {
    if (span.getAttribute("data-bre-time") !== time) span.setAttribute("data-bre-time", time);
  }
}

export function observeExpiryTimes(document: Document): () => void {
  const window = document.defaultView!;
  let frame: number | undefined;
  const observer = new window.MutationObserver(() => {
    if (frame !== undefined) return;
    frame = window.requestAnimationFrame(() => {
      frame = undefined;
      updateExpiryTimes(document);
    });
  });
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["title", "id", "aria-describedby", "aria-controls", "role"],
  });
  updateExpiryTimes(document);

  return () => {
    observer.disconnect();
    if (frame !== undefined) window.cancelAnimationFrame(frame);
  };
}
