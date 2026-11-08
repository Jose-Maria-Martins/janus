import { useEffect, useState } from 'react';
import { useLocation, useNavigationType, useOutlet } from 'react-router';
import { AnimatePresence, motion, type Variants } from 'motion/react';
import { BottomTabs } from './BottomTabs';
import { Sidebar } from './Sidebar';
import { isTabRoute } from './nav';

const SLIDE = { duration: 0.34, ease: [0.32, 0.72, 0, 1] } as const;

/**
 * Screens are stacked in one grid cell so the old screen stays underneath
 * while the new one slides over it (or, going back, slides away on top of it).
 * `custom` = whether this navigation is a "back" (POP).
 */
function screenVariants(push: boolean): Variants {
  return {
    initial: (pop: boolean) => (push && !pop ? { x: '100%', zIndex: 30 } : { x: 0, zIndex: 30 }),
    enter: { x: 0, zIndex: 30, transition: SLIDE },
    exit: (pop: boolean) =>
      pop
        ? push
          ? { x: '100%', zIndex: 40, transition: SLIDE }
          : { opacity: 0, zIndex: 40, transition: { duration: 0 } }
        : { zIndex: 10, opacity: 0, transition: { opacity: { delay: SLIDE.duration, duration: 0 } } },
  };
}

/** Keeps rendering the route it was mounted with, so it can animate out. */
function FrozenOutlet() {
  const outlet = useOutlet();
  const [frozen] = useState(outlet);
  return frozen;
}

export function Shell() {
  const { pathname } = useLocation();
  const pop = useNavigationType() === 'POP';
  const tab = isTabRoute(pathname);

  useEffect(() => {
    if (!pop) window.scrollTo(0, 0);
  }, [pathname, pop]);

  return (
    <div className="min-h-dvh bg-background">
      <Sidebar />
      <main className="grid grid-cols-[minmax(0,1fr)] overflow-x-clip lg:pl-[260px]">
        <AnimatePresence initial={false} custom={pop}>
          <motion.div
            key={pathname}
            custom={pop}
            variants={screenVariants(!tab)}
            initial="initial"
            animate="enter"
            exit="exit"
            className="relative col-start-1 row-start-1 min-h-dvh bg-background"
          >
            <div className="mx-auto w-full max-w-[720px]">
              <FrozenOutlet />
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
      <AnimatePresence>{tab && <BottomTabs />}</AnimatePresence>
    </div>
  );
}
