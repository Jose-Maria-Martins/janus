import { Link } from 'react-router';
import { CalendarClock, ShieldAlert } from 'lucide-react';
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item';
import { attentionItems } from '@/lib/attention';
import { BottomSheet } from './BottomSheet';
import { IconCircle } from './IconCircle';

export function NotificationsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Notifications">
      <ItemGroup className="-mx-3 gap-0">
        {attentionItems().map((item) => {
          const renewal = item.kind === 'renewal';
          const Icon = renewal ? CalendarClock : ShieldAlert;
          return (
            <Item key={item.title} asChild>
              <Link to={item.to} onClick={onClose}>
                <ItemMedia>
                  <IconCircle>
                    <Icon className={renewal ? 'text-warning' : 'text-destructive'} />
                  </IconCircle>
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{item.title}</ItemTitle>
                  <ItemDescription>{renewal ? 'Compare prices before it renews' : 'Not covered yet'}</ItemDescription>
                </ItemContent>
              </Link>
            </Item>
          );
        })}
      </ItemGroup>
    </BottomSheet>
  );
}
