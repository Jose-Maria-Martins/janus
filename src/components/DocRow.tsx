import type { ReactNode } from 'react';
import { Download } from 'lucide-react';
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui/item';
import { IconCircle } from './IconCircle';

/** A document to download: icon, name, "PDF · …", download arrow. */
export function DocRow({ icon, title, subtitle, onClick }: { icon: ReactNode; title: string; subtitle: string; onClick: () => void }) {
  return (
    <Item asChild>
      <button onClick={onClick}>
        <ItemMedia>
          <IconCircle>{icon}</IconCircle>
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{title}</ItemTitle>
          <ItemDescription>{subtitle}</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Download className="size-5 text-muted-foreground" />
        </ItemActions>
      </button>
    </Item>
  );
}
