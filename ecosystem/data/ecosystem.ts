import type { EcosystemEntity } from "../types/ecosystem";

// Illustrative relationships and statuses for the ecosystem preview.
export const trainerId = "industrial-safety-vr-trainer";

const records: Omit<EcosystemEntity, "href">[] = [
  {
    id: "computer-science",
    name: "Algoma Computer Science Lab",
    pillar: "research",
    status: "live",
    tags: ["Algoma University", "Applied computing", "Student research"],
    connectedIds: ["digital-twins", "gamejam-studio"],
  },
  {
    id: "digital-twins",
    name: "Algoma Digital Twins Lab",
    pillar: "xr-lab",
    status: "open",
    tags: ["Simulation", "Digital twins", "XR"],
    summary: "This sample lab brief explores how a virtual model of a physical workspace could support XR training and scenario testing.",
    connectedIds: ["computer-science", "gamejam-training", "altitude-venture", "altitude-visualization", trainerId],
  },
  {
    id: "gamejam-studio",
    name: "Startup GameJam · Spatial Studio team",
    pillar: "talent",
    status: "cohort-active",
    tags: ["GameJam", "Spatial design", "Prototyping"],
    connectedIds: ["computer-science", "altitude-venture"],
  },
  {
    id: "gamejam-training",
    name: "Startup GameJam · XR Training team",
    pillar: "talent",
    status: "cohort-active",
    tags: ["GameJam", "XR training", "Immersive learning"],
    connectedIds: ["digital-twins", "altitude-visualization", "xr-partner"],
  },
  {
    id: "altitude-venture",
    name: "Altitude Accelerator · Simulation venture",
    pillar: "incubator",
    status: "cohort-active",
    tags: ["Startup", "Simulation", "Venture development"],
    summary: "This sample venture brief explores adapting student-built simulations into onboarding pilots for industry partners.",
    connectedIds: ["digital-twins", "gamejam-studio", "xr-partner", trainerId],
  },
  {
    id: "altitude-visualization",
    name: "Altitude Accelerator · Visualization venture",
    pillar: "incubator",
    status: "cohort-active",
    tags: ["Startup", "Visualization", "Industrial design"],
    connectedIds: ["digital-twins", "gamejam-training"],
  },
  {
    id: "xr-partner",
    name: "XR Accelerator · Industry partner",
    pillar: "industry",
    status: "open",
    tags: ["Industry", "Pilots", "XR mentoring"],
    connectedIds: ["gamejam-training", "altitude-venture"],
  },
  {
    id: trainerId,
    name: "Industrial Safety VR Trainer",
    pillar: "talent",
    status: "live",
    tags: ["Student XR demo", "Industrial onboarding", "Safety simulation"],
    summary: "A student project that uses a warehouse hazard scenario to demonstrate immersive safety training.",
    connectedIds: ["digital-twins", "altitude-venture"],
    resource: { href: "/projects/P01", label: "View project and demo" },
  },
];

export const ecosystemEntities: EcosystemEntity[] = records.map(record => ({
  ...record,
  href: "/ecosystem#" + record.id,
}));

export const entityById = new Map(ecosystemEntities.map(entity => [entity.id, entity]));

export function ecosystemRecordHref(entity: EcosystemEntity) {
  return "/ecosystem/records/" + encodeURIComponent(entity.id);
}
