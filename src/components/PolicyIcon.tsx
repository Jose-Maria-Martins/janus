import { POLICY_STYLE } from '../lib/policyStyle';
import type { PolicyType } from '../types';

export function PolicyIcon({ type, size = 40 }: { type: PolicyType; size?: number }) {
  const { icon: Icon, color } = POLICY_STYLE[type];
  return (
    <span className="grid shrink-0 place-items-center rounded-full" style={{ width: size, height: size, background: color }}>
      <Icon size={size * 0.5} strokeWidth={2.2} color="#fff" />
    </span>
  );
}
