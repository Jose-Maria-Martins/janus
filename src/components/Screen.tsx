import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ItemGroup } from '@/components/ui/item';
import { useScrolled } from '@/lib/useScrolled';
import { TopBar } from './TopBar';

/** A main tab screen: top bar, then content, with room for the bottom tab bar. */
export function TabScreen({ children }: { children: ReactNode }) {
  return (
    <div className="pb-28 lg:pb-12">
      <TopBar />
      <div className="px-4">{children}</div>
    </div>
  );
}

/** A detail screen that slid in from the right: back arrow, optional title. */
export function PushScreen({ title, children }: { title?: string; children: ReactNode }) {
  const navigate = useNavigate();
  const back = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/'));
  const scrolled = useScrolled();

  return (
    <div className="pb-16">
      <header className={`sticky top-0 z-20 flex items-center gap-2 px-2 py-2 transition-colors duration-200 ${scrolled ? 'bg-background' : ''}`}>
        <Button variant="ghost" size="icon" onClick={back} aria-label="Back">
          <ArrowLeft className="size-6" />
        </Button>
        {title && <h1 className="truncate text-lg font-semibold">{title}</h1>}
      </header>
      <div className="px-4">{children}</div>
    </div>
  );
}

/**
 * A Revolut widget as a shadcn Card: small grey title (a link with a chevron when `to` is set),
 * then a list of Items.
 */
export function Widget({ title, to, children }: { title?: string; to?: string; children: ReactNode }) {
  const heading = (
    <span className="inline-flex items-center gap-0.5">
      {title}
      {to && <ChevronRight className="size-4" strokeWidth={2.4} />}
    </span>
  );
  return (
    <Card className="mt-4 gap-0 py-1.5">
      {title && (
        <CardHeader className="px-4.5 pt-2.5 pb-0.5">
          <CardTitle className="text-sm font-medium text-muted-foreground">{to ? <Link to={to}>{heading}</Link> : heading}</CardTitle>
        </CardHeader>
      )}
      <ItemGroup className="gap-0 px-1.5">{children}</ItemGroup>
    </Card>
  );
}
