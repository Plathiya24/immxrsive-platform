export const pillars = {
  talent: "Talent",
  "xr-lab": "XR labs",
  research: "Research",
  incubator: "Incubators",
  industry: "Industry partners",
} as const;

export type EcosystemEntity = {
  id: string;
  name: string;
  pillar: keyof typeof pillars;
  status: "live" | "open" | "cohort-active";
  tags: string[];
  href: string;
  connectedIds: string[];
};

export const statuses: Record<EcosystemEntity["status"], string> = {
  live: "Live",
  open: "Open",
  "cohort-active": "Cohort active",
};
