import type { ReactNode } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

type Props = {
  /** 0–1; hidden when undefined (e.g. on the success screen). */
  progress?: number;
  /** Back arrow goes one step back; on the first step a cross leaves the flow. */
  onBack: () => void;
  first?: boolean;
  /** The main button (or buttons) pinned to the bottom: shadcn Buttons, size "lg". */
  footer?: ReactNode;
  children: ReactNode;
};

/** One question per screen: progress bar at the top, big heading, one big button at the bottom. */
export function FlowScreen({ progress, onBack, first, footer, children }: Props) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 flex items-center gap-3 bg-background px-2 py-2">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label={first ? 'Close' : 'Back'}>
          {first ? <X className="size-6" /> : <ArrowLeft className="size-6" />}
        </Button>
        {progress !== undefined && <Progress value={progress * 100} className="mr-4 flex-1" />}
      </header>

      <div className="flex-1 px-5 pt-4">{children}</div>

      {footer && (
        <div className="sticky bottom-0 flex flex-col gap-1 bg-gradient-to-t from-background from-70% to-transparent px-5 pt-6 pb-[max(20px,env(safe-area-inset-bottom))]">
          {footer}
        </div>
      )}
    </div>
  );
}

/** Big heading and a short line under it. */
export function FlowHeading({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <>
      <h1 className="text-3xl leading-tight font-bold tracking-tight">{title}</h1>
      {children && <p className="mt-2 text-base text-muted-foreground">{children}</p>}
    </>
  );
}
