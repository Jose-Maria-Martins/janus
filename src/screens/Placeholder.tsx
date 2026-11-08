import { PushScreen, TabScreen } from '../components/Screen';

/** Temporary stand-ins until each screen is built. */
export function Placeholder({ title, step }: { title: string; step: number }) {
  return (
    <TabScreen>
      <h1 className="pt-6 text-3xl font-bold">{title}</h1>
      <p className="mt-2 text-muted-foreground">Built in step {step}.</p>
    </TabScreen>
  );
}

export function PushPlaceholder({ title, step }: { title: string; step: number }) {
  return (
    <PushScreen>
      <h1 className="pt-4 text-3xl font-bold">{title}</h1>
      <p className="mt-2 text-muted-foreground">Built in step {step}.</p>
    </PushScreen>
  );
}
