import { Building2, CarFront, HardHat, HeartPulse, Lock, Scale, Store, Truck, Wrench, type LucideIcon } from 'lucide-react';
import type { PolicyType } from '../types';

/** One bright colour and icon per type of cover, like Revolut's coloured circles. */
export const POLICY_STYLE: Record<PolicyType, { icon: LucideIcon; color: string }> = {
  work_accident: { icon: HardHat, color: '#ff7a45' },
  vehicles: { icon: Truck, color: '#5f8bff' },
  multirisk: { icon: Building2, color: '#22c3c3' },
  liability: { icon: Scale, color: '#b45cf0' },
  health: { icon: HeartPulse, color: '#ff5f8f' },
  cyber: { icon: Lock, color: '#7b7bff' },
  business_interruption: { icon: Store, color: '#f5a623' },
  vehicles_own_damage: { icon: CarFront, color: '#ff6363' },
  tools_equipment: { icon: Wrench, color: '#a8c520' },
};

export const policyColor = (type: PolicyType) => POLICY_STYLE[type].color;
