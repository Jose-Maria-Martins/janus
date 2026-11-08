import { useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { ArrowLeftRight, CalendarClock, MessageCircle, Plus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ActivityRow } from '@/components/ActivityRow';
import { PolicyIcon } from '@/components/PolicyIcon';
import { PolicyRow } from '@/components/PolicyRow';
import { QuickAction } from '@/components/QuickAction';
import { TabScreen, Widget } from '@/components/Screen';
import { useStore } from '@/data/store';
import { attentionItems, nextRenewal } from '@/lib/attention';
import { daysUntil } from '@/lib/dates';
import { formatEUR } from '@/lib/format';

/** Revolut's home wallpaper: bright violet at the top, fading into the indigo page. */
const WALLPAPER =
  'linear-gradient(180deg, #a42cf2 0px, #8b3ef4 150px, #6654f1 320px, #4a43c6 430px, #2e2873 540px, #1c1835 660px)';

export function HomeScreen() {
  const { policies, activity } = useStore();
  const total = policies.reduce((sum, p) => sum + p.annualPremium, 0);
  const next = nextRenewal();
  const sorted = [...activity].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[660px]" style={{ background: WALLPAPER }} />

      <div className="relative">
        <TabScreen>
          {/* Balance-style header */}
          <section className="pt-16 text-center">
            <p className="text-sm font-medium text-foreground/90">Annual premium · {policies.length} policies</p>
            <p className="mt-2 text-6xl leading-none font-semibold tracking-tight tabular-nums">
              <span className="mr-1 text-3xl tracking-normal">€</span>
              {total.toLocaleString('en-IE')}
            </p>
            <p className="mt-3 inline-flex items-center gap-2 text-sm text-foreground/90">
              <CalendarClock className="size-4" />
              Next renewal in {daysUntil(next.renewalDate)} days
            </p>
            <div className="mt-12">
              <Button asChild className="bg-white/20 hover:bg-white/25">
                <Link to="/policies">Policies</Link>
              </Button>
            </div>
          </section>

          <nav className="mt-5 flex justify-center gap-1 sm:gap-6">
            <QuickAction to="/import" label="Import" icon={Upload} />
            <QuickAction to={`/buy?tab=switch&policy=${next.id}`} label="Compare" icon={ArrowLeftRight} />
            <QuickAction to="/buy?tab=add" label="Add cover" icon={Plus} />
            <QuickAction to="/ask" label="Ask" icon={MessageCircle} />
          </nav>

          {/* Things to act on, in the slot where Revolut shows its offers */}
          <Carousel>
            {attentionItems().map((item) => (
              <Link
                key={item.title}
                to={item.to}
                className="flex min-h-28 shrink-0 basis-full snap-start items-center gap-4 rounded-xl bg-white/10 p-5 transition-colors hover:bg-white/15"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-lg leading-snug font-semibold">{item.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-foreground/75">{item.message}</p>
                </div>
                <PolicyIcon type={item.type} size={56} />
              </Link>
            ))}
          </Carousel>

          <Widget title="Activity">
            {sorted.map((a, i) => (
              <ActivityRow key={i} item={a} />
            ))}
          </Widget>

          <Widget title="Policies" to="/policies">
            <p className="px-3 pt-1 pb-1 text-3xl font-semibold tracking-tight tabular-nums">
              {formatEUR(total)}
              <span className="ml-1.5 text-base font-medium tracking-normal text-muted-foreground">/ year</span>
            </p>
            {policies.map((p) => (
              <PolicyRow key={p.id} policy={p} />
            ))}
          </Widget>
        </TabScreen>
      </div>
    </>
  );
}

/** Swipeable, snapping row of full-width cards with dots. */
function Carousel({ children }: { children: ReactNode[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const onScroll = () => {
    const el = ref.current;
    const first = el?.firstElementChild as HTMLElement | null;
    if (el && first) setIndex(Math.round(el.scrollLeft / (first.offsetWidth + 8)));
  };

  return (
    <section className="mt-8">
      <div ref={ref} onScroll={onScroll} className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-2 overflow-x-auto px-4">
        {children}
      </div>
      <div className="mt-3 flex justify-center gap-1.5">
        {children.map((_, i) => (
          <span key={i} className={`size-1.5 rounded-full transition-colors ${i === index ? 'bg-foreground' : 'bg-foreground/35'}`} />
        ))}
      </div>
    </section>
  );
}
