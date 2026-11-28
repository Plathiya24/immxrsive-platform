import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { statuses } from "../types/ecosystem";
import { badgeStateIndex, type EcosystemStatusBadgeProps } from "../types/ecosystem-status";

const RiveStatusIndicator = dynamic(() => import("./RiveStatusIndicator"), { ssr: false });
const visibilityListeners = new WeakMap<Element, (visible: boolean) => void>();
let badgeObserver: IntersectionObserver | undefined;

export function EcosystemStatusBadge({ status }: EcosystemStatusBadgeProps) {
  const element = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [allowsMotion, setAllowsMotion] = useState(false);

  useEffect(() => {
    if (!window.matchMedia) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setAllowsMotion(!preference.matches);
    update();
    preference.addEventListener?.("change", update);
    return () => preference.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    const target = element.current;
    if (!target || !allowsMotion || !("IntersectionObserver" in window)) return;

    badgeObserver ??= new IntersectionObserver(entries => {
      for (const entry of entries) visibilityListeners.get(entry.target)?.(entry.isIntersecting);
    });
    const observer = badgeObserver;
    visibilityListeners.set(target, setVisible);
    observer.observe(target);
    return () => {
      observer.unobserve(target);
      visibilityListeners.delete(target);
    };
  }, [allowsMotion]);

  return (
    <span className="ecosystem-status" data-status={status} ref={element}>
      <span className="ecosystem-status-icon" aria-hidden="true">
        <span className="ecosystem-status-dot" />
        {allowsMotion && visible && <RiveStatusIndicator stateIndex={badgeStateIndex[status]} />}
      </span>
      <span>{statuses[status]}</span>
    </span>
  );
}
