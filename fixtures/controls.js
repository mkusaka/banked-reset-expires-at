const available = document.querySelector('[role="tabpanel"]');
const originalRows = available.innerHTML;

document.querySelector('[data-action="replace"]').addEventListener("click", () => {
  const replacement = available.firstElementChild.cloneNode(true);
  replacement
    .querySelectorAll("[data-bre-time]")
    .forEach((span) => span.removeAttribute("data-bre-time"));
  available.firstElementChild.replaceWith(replacement);
});
document.querySelector('[data-action="rerender"]').addEventListener("click", () => {
  available.innerHTML = originalRows;
});
document.querySelector('[data-action="theme"]').addEventListener("click", () => {
  document.documentElement.classList.toggle("dark");
});
document.querySelectorAll('[role="tab"]').forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll('[role="tab"]').forEach((other) => {
      const selected = other === tab;
      other.setAttribute("aria-selected", String(selected));
      other.tabIndex = selected ? 0 : -1;
      document.getElementById(other.getAttribute("aria-controls")).hidden = !selected;
    });
  });
});
