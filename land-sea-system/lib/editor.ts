export function focusEditorPanel(element: HTMLElement | null) {
  if (!element) {
    return;
  }

  const behavior: ScrollBehavior =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth";

  element.scrollIntoView({
    behavior,
    block: "start",
  });

  element.scrollTo({
    top: 0,
    behavior,
  });
}
