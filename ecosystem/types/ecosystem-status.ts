import type { EcosystemEntity } from "./ecosystem";

export type EcosystemStatusBadgeProps = { status: EcosystemEntity["status"] };

export const badgeAsset = {
  path: "/assets/status-badge.riv",
  artboard: "Status Badge",
  stateMachineName: "State Machine 1",
  input: "stateIndex",
} as const;

export const badgeStateIndex = {
  live: 0,
  open: 1,
  "cohort-active": 2,
} as const satisfies Record<EcosystemStatusBadgeProps["status"], number>;
