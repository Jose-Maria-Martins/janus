import type { ReactNode } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { useIsDesktop } from '@/lib/useMediaQuery';

type Props = {
  open: boolean;
  onClose: () => void;
  /** Shown as the heading; without one (e.g. a success view) it is only read by screen readers. */
  title?: string;
  children: ReactNode;
};

/** shadcn Drawer on phones (swipe down to close), shadcn Dialog on desktop. */
export function BottomSheet({ open, onClose, title, children }: Props) {
  const desktop = useIsDesktop();
  const onOpenChange = (next: boolean) => {
    if (!next) onClose();
  };

  if (desktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader className={title ? '' : 'sr-only'}>
            <DialogTitle>{title ?? 'Done'}</DialogTitle>
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent aria-describedby={undefined}>
        <DrawerHeader className={title ? 'px-5 pt-4' : 'sr-only'}>
          <DrawerTitle>{title ?? 'Done'}</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto px-5 pt-1 pb-[max(24px,env(safe-area-inset-bottom))]">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}
