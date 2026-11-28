export function paletteShortcut(event: KeyboardEvent): boolean {
  return !event.defaultPrevented && !event.repeat && !event.altKey && !event.shiftKey &&
    (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
}

export function paletteKeys() {
  return /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘ K" : "Ctrl K";
}
