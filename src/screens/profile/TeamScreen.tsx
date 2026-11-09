import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui/item';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { BottomSheet } from '@/components/BottomSheet';
import { IconCircle } from '@/components/IconCircle';
import { PushScreen, Widget } from '@/components/Screen';
import { SuccessView } from '@/components/SuccessView';
import { setState, useStore } from '@/data/store';
import { initials } from '@/lib/format';
import type { TeamMember } from '@/types';

const ACCESS: { id: TeamMember['access']; detail: string }[] = [
  { id: 'Admin', detail: 'Can buy, change and claim' },
  { id: 'View only', detail: 'Can see policies and documents' },
];

/** Who can use Janus for the company, and inviting someone new. */
export function TeamScreen() {
  const { team } = useStore();
  const [inviting, setInviting] = useState(false);

  return (
    <PushScreen title="Team">
      <Widget>
        {team.map((m) => (
          <Item key={m.email ?? m.name}>
            <ItemMedia>
              <IconCircle className="text-sm font-semibold">{initials(m.name) || m.name[0]?.toUpperCase()}</IconCircle>
            </ItemMedia>
            <ItemContent>
              <ItemTitle className="block w-full truncate">{m.name}</ItemTitle>
              <ItemDescription className="line-clamp-1">
                {m.invited ? m.email : m.role} · {m.access}
              </ItemDescription>
            </ItemContent>
            {m.invited && (
              <ItemActions>
                <Badge variant="warning">Invited</Badge>
              </ItemActions>
            )}
          </Item>
        ))}
      </Widget>
      <Button size="lg" className="mt-6 w-full" onClick={() => setInviting(true)}>
        <UserPlus />
        Invite someone
      </Button>
      <InviteSheet open={inviting} onClose={() => setInviting(false)} />
    </PushScreen>
  );
}

/** Name, email and access → "Invite sent"; the person shows in the list as Invited. */
function InviteSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [access, setAccess] = useState<TeamMember['access']>('View only');
  const [sent, setSent] = useState<TeamMember>();
  const valid = name.trim() && /^\S+@\S+\.\S+$/.test(email.trim());

  const close = () => {
    onClose();
    setTimeout(() => {
      setSent(undefined);
      setName('');
      setEmail('');
      setAccess('View only');
    }, 300);
  };

  const send = () => {
    const member: TeamMember = { name: name.trim(), email: email.trim(), access, invited: true };
    setState((s) => ({ ...s, team: [...s.team, member] }));
    setSent(member);
  };

  return (
    <BottomSheet open={open} onClose={close} title={sent ? undefined : 'Invite someone'}>
      {sent ? (
        <SuccessView title="Invite sent" lines={[`${sent.name} gets an email at ${sent.email} to join.`]}>
          <Button size="lg" className="w-full" onClick={close}>
            Done
          </Button>
        </SuccessView>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) send();
          }}
        >
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" aria-label="Name" autoComplete="off" />
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            aria-label="Email"
            autoComplete="off"
            className="mt-3"
          />
          <RadioGroup value={access} onValueChange={(v) => setAccess(v as TeamMember['access'])} className="mt-3 gap-0">
            {ACCESS.map((a) => (
              <Label key={a.id} htmlFor={`access-${a.id}`} className="flex cursor-pointer items-center justify-between gap-4 py-3">
                <span>
                  <span className="block text-base font-medium">{a.id}</span>
                  <span className="block text-sm font-normal text-muted-foreground">{a.detail}</span>
                </span>
                <RadioGroupItem id={`access-${a.id}`} value={a.id} />
              </Label>
            ))}
          </RadioGroup>
          <Button type="submit" size="lg" className="mt-5 w-full" disabled={!valid}>
            Send invite
          </Button>
        </form>
      )}
    </BottomSheet>
  );
}
