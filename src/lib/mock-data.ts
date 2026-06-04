// Re-export from feature — canonical location is src/features/crm-chips/mock-data.ts
export {
  clinics,
  channels,
  contingency,
  alerts,
  templates,
  apiVolumes,
  templateCostByCategory,
} from "@/features/crm-chips/mock-data";

export type {
  Clinic,
  Channel,
  ChannelMonitoring,
  Contingency,
  Alert,
  MetaTemplate,
  ApiVolume,
  ClinicStatus,
  ChannelType,
  ChannelStatus,
  AlertSeverity,
  AlertStatus,
  DataOrigin,
  QualityRating,
  NumberStatus,
  TemplateCategory,
  TemplateStatus,
} from "@/features/crm-chips/types";
