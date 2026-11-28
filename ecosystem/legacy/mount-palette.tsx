import { createRoot } from "react-dom/client";
import { CommandPalette, type PaletteScope } from "../components/CommandPalette";
import { ecosystemRecordHref, entityById, trainerId } from "../data/ecosystem";

const trainer = entityById.get(trainerId);
export const trainerScope = trainer ? { relatedTo: trainer } : undefined;

export function mountPalette(previous: HTMLElement, scope?: PaletteScope) {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  root.render(
    <CommandPalette
      initialScope={scope}
      onClose={() => {
        root.unmount();
        host.remove();
        if (previous.isConnected) previous.focus();
      }}
      onNavigate={entity => {
        root.unmount();
        host.remove();
        window.location.assign(ecosystemRecordHref(entity));
      }}
    />,
  );
}
