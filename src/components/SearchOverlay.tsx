import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { ClipboardList, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui/item';
import { insurerById } from '@/data';
import { useStore } from '@/data/store';
import { formatEUR, POLICY_LABEL } from '@/lib/format';
import { IconCircle } from './IconCircle';
import { InsurerLogo } from './InsurerLogo';
import { RowTitle } from './RowTitle';
import { Widget } from './Screen';

/** Full-screen search over policies (type, insurer, number) and claims. */
export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const store = useStore();
  const policies = store.policies.filter((p) =>
    [POLICY_LABEL[p.type], insurerById(p.insurerId).name, p.policyNumber].some((s) => s.toLowerCase().includes(q)),
  );
  const claims = store.claims.filter((c) => [c.title, c.number].some((s) => s.toLowerCase().includes(q)));
  const close = () => {
    setQuery('');
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 overflow-y-auto bg-background"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div className="mx-auto max-w-[720px] px-4 pb-10">
            <div className="sticky top-0 z-10 flex items-center gap-2 bg-background py-2.5">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search policies, claims…"
                  className="h-11 rounded-full pl-11"
                />
              </div>
              <Button variant="link" onClick={close} className="px-2">
                Cancel
              </Button>
            </div>

            {policies.length > 0 && (
              <Widget title="Policies">
                {policies.map((p) => {
                  const insurer = insurerById(p.insurerId);
                  return (
                    <Item key={p.id} asChild>
                      <Link to={`/policies/${p.id}`} onClick={close}>
                        <ItemMedia>
                          <InsurerLogo insurer={insurer} />
                        </ItemMedia>
                        <ItemContent>
                          <RowTitle amount={formatEUR(p.annualPremium)}>{POLICY_LABEL[p.type]}</RowTitle>
                          <ItemDescription className="line-clamp-1">
                            {insurer.name} · {p.policyNumber}
                          </ItemDescription>
                        </ItemContent>
                      </Link>
                    </Item>
                  );
                })}
              </Widget>
            )}

            {claims.length > 0 && (
              <Widget title="Claims">
                {claims.map((c) => (
                  <Item key={c.id} asChild>
                    <Link to={`/claims/${c.id}`} onClick={close}>
                      <ItemMedia>
                        <IconCircle>
                          <ClipboardList />
                        </IconCircle>
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle>{c.title}</ItemTitle>
                      </ItemContent>
                    </Link>
                  </Item>
                ))}
              </Widget>
            )}

            {policies.length + claims.length === 0 && <p className="pt-16 text-center text-muted-foreground">No results for “{query}”</p>}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
