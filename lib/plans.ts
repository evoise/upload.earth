export type PlanType = "free" | "starter" | "pro" | "enterprise";

export interface PlanLimits {
  uploadsPerMonth: number;
  apiRequestsPerMonth: number;
  storageGB: number;
  maxFileSizeMB: number;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    uploadsPerMonth: 100,
    apiRequestsPerMonth: 0,
    storageGB: 1,
    maxFileSizeMB: 10,
  },
  starter: {
    uploadsPerMonth: 1000,
    apiRequestsPerMonth: 10000,
    storageGB: 100,
    maxFileSizeMB: 10,
  },
  pro: {
    uploadsPerMonth: 10000,
    apiRequestsPerMonth: 100000,
    storageGB: 300,
    maxFileSizeMB: 10,
  },
  enterprise: {
    uploadsPerMonth: -1,
    apiRequestsPerMonth: -1,
    storageGB: -1,
    maxFileSizeMB: 10,
  },
};

export function getPlanLimits(plan: PlanType): PlanLimits {
  return PLAN_LIMITS[plan];
}

export function isUnlimited(value: number): boolean {
  return value === -1;
}

