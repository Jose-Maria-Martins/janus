import { useState, type ReactNode } from 'react';
import { CarFront, ChevronRight, UserMinus, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { BottomSheet } from '@/components/BottomSheet';
import { IconCircle } from '@/components/IconCircle';
import { SuccessView } from '@/components/SuccessView';
import { activityToday, setState, useStore } from '@/data/store';
import { formatEUR, POLICY_LABEL } from '@/lib/format';
import { changeKind, unitPrice } from '@/lib/policy';
import { lookUpPlate, plateKey as toPlateKey } from '@/lib/plates';
import type { Policy, Vehicle } from '@/types';

type Step = 'menu' | 'add' | 'remove' | 'done';

/** Add or remove an employee or a van. Changes apply instantly and move the premium. */
export function ChangeSheet({ policy, open, onClose }: { policy: Policy; open: boolean; onClose: () => void }) {
  const { company } = useStore();
  const kind = changeKind(policy.type)!;
  const vans = kind === 'vehicles';
  const unit = unitPrice(policy, company);

  const [step, setStep] = useState<Step>('menu');
  const [name, setName] = useState('');
  const [plate, setPlate] = useState('');
  const [found, setFound] = useState<Vehicle>();
  const [picked, setPicked] = useState<string>();
  const [result, setResult] = useState({ line: '', premium: 0 });

  const close = () => {
    onClose();
    setTimeout(() => {
      setStep('menu');
      setName('');
      setPlate('');
      setFound(undefined);
      setPicked(undefined);
    }, 300);
  };

  /** Applies the change: premium, headcount or fleet, and an activity row. */
  const apply = (add: boolean, subject: string, vehicles?: Vehicle[]) => {
    const premium = policy.annualPremium + (add ? unit : -unit);
    setState((s) => ({
      ...s,
      company: vans ? s.company : { ...s.company, employees: s.company.employees + (add ? 1 : -1) },
      policies: s.policies.map((p) => (p.id === policy.id ? { ...p, annualPremium: premium, ...(vehicles && { vehicles }) } : p)),
      activity: [
        activityToday({
          type: 'change',
          text: add ? `Added ${subject} to ${POLICY_LABEL[policy.type].toLowerCase()}` : `Removed ${subject} from ${POLICY_LABEL[policy.type].toLowerCase()}`,
          policyId: policy.id,
        }),
        ...s.activity,
      ],
    }));
    setResult({ line: add ? `${subject} is covered from today.` : `${subject} is no longer on the policy.`, premium });
    setStep('done');
  };

  const plateKey = toPlateKey(plate);
  const lookUp = () => setFound(lookUpPlate(plateKey));
  const duplicate = found && policy.vehicles?.some((v) => v.plate === found.plate);

  const titles: Record<Step, string | undefined> = {
    menu: 'Make a change',
    add: vans ? 'Add a van' : 'Add an employee',
    remove: vans ? 'Remove a van' : 'Remove an employee',
    done: undefined,
  };

  return (
    <BottomSheet open={open} onClose={close} title={titles[step]}>
      {step === 'menu' && (
        <>
          <ItemGroup className="-mx-3 gap-0">
            {[
              { to: 'add' as const, label: `Add ${vans ? 'a van' : 'an employee'}`, icon: vans ? CarFront : UserPlus, price: `+${formatEUR(unit)} a year` },
              { to: 'remove' as const, label: `Remove ${vans ? 'a van' : 'an employee'}`, icon: vans ? CarFront : UserMinus, price: `−${formatEUR(unit)} a year` },
            ].map(({ to, label, icon: Icon, price }) => (
              <Item key={to} asChild>
                <button onClick={() => setStep(to)}>
                  <ItemMedia>
                    <IconCircle>
                      <Icon />
                    </IconCircle>
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{label}</ItemTitle>
                    <ItemDescription>{price}</ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <ChevronRight className="size-5 text-muted-foreground" />
                  </ItemActions>
                </button>
              </Item>
            ))}
          </ItemGroup>
          <p className="pt-3 text-sm text-muted-foreground">
            {vans ? `${policy.vehicles?.length ?? 0} vans` : `${company.employees} employees`} on this policy now. Changes apply straight away.
          </p>
        </>
      )}

      {step !== 'menu' && step !== 'done' && !vans && (
        <Form
          button={step === 'add' ? `Add · +${formatEUR(unit)} a year` : `Remove · −${formatEUR(unit)} a year`}
          disabled={!name.trim()}
          onSubmit={() => apply(step === 'add', name.trim())}
        >
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
        </Form>
      )}

      {step === 'add' && vans && (
        <Form
          button={found ? `Add · +${formatEUR(unit)} a year` : 'Find van'}
          disabled={found ? !!duplicate : plateKey.length !== 6}
          onSubmit={found ? () => apply(true, found.plate, [...(policy.vehicles ?? []), found]) : lookUp}
        >
          <Input
            autoFocus
            value={plate}
            onChange={(e) => {
              setPlate(e.target.value);
              setFound(undefined);
            }}
            placeholder="Plate, e.g. AB-12-CD"
            className="uppercase placeholder:normal-case"
          />
          {found && (
            <Card className="mt-3 gap-1 bg-secondary px-4">
              <p className="font-semibold">
                {found.model} · {found.year}
              </p>
              <p className="text-sm text-muted-foreground">{found.plate}</p>
              <p className={`mt-1 text-sm ${duplicate ? 'text-destructive' : 'text-muted-foreground'}`}>
                {duplicate ? 'This van is already on the policy.' : 'Same cover as your other vans: third party, glass and roadside.'}
              </p>
            </Card>
          )}
        </Form>
      )}

      {step === 'remove' && vans && (
        <Form
          button={`Remove · −${formatEUR(unit)} a year`}
          disabled={!picked}
          onSubmit={() => apply(false, picked!, policy.vehicles?.filter((v) => v.plate !== picked))}
        >
          <RadioGroup value={picked ?? ''} onValueChange={setPicked} className="max-h-[45dvh] gap-0 overflow-y-auto">
            {policy.vehicles?.map((v) => (
              <Label key={v.plate} htmlFor={`van-${v.plate}`} className="flex cursor-pointer items-center justify-between py-2.5">
                <span>
                  <span className="block text-base font-medium">{v.plate}</span>
                  <span className="block text-sm font-normal text-muted-foreground">
                    {v.model} · {v.year}
                  </span>
                </span>
                <RadioGroupItem id={`van-${v.plate}`} value={v.plate} />
              </Label>
            ))}
          </RadioGroup>
        </Form>
      )}

      {step === 'done' && (
        <SuccessView title="Done" lines={[result.line, `Your ${POLICY_LABEL[policy.type].toLowerCase()} premium is now ${formatEUR(result.premium)} a year.`]}>
          <Button size="lg" className="w-full" onClick={close}>
            Done
          </Button>
        </SuccessView>
      )}
    </BottomSheet>
  );
}

function Form({ button, disabled, onSubmit, children }: { button: string; disabled: boolean; onSubmit: () => void; children: ReactNode }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!disabled) onSubmit();
      }}
    >
      {children}
      <Button type="submit" size="lg" className="mt-5 w-full" disabled={disabled}>
        {button}
      </Button>
    </form>
  );
}
