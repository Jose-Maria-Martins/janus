import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Insurer } from '@/types';

/** Logo in a white circle; until (or unless) it loads, a coloured circle with initials. */
export function InsurerLogo({ insurer, size = 40 }: { insurer: Insurer; size?: number }) {
  return (
    <Avatar style={{ width: size, height: size }} aria-label={insurer.name}>
      <AvatarImage src={insurer.logo} alt="" className="bg-white object-contain p-[14%]" />
      <AvatarFallback className="font-bold text-white" style={{ background: insurer.color, fontSize: size * 0.34 }}>
        {insurer.initials}
      </AvatarFallback>
    </Avatar>
  );
}
