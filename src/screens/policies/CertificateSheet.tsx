import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { BottomSheet } from '@/components/BottomSheet';
import { SuccessView } from '@/components/SuccessView';
import { activityToday, setState } from '@/data/store';
import { formatDate, todayIso } from '@/lib/dates';
import { downloadCertificate } from '@/lib/documents';
import { POLICY_LABEL } from '@/lib/format';
import type { Certificate, Policy } from '@/types';

const PURPOSES = [
  { id: 'client', label: 'A client', placeholder: "Client's name" },
  { id: 'bank', label: 'A bank', placeholder: "Bank's name" },
  { id: 'tender', label: 'A public tender', placeholder: 'Tender name or reference' },
  { id: 'other', label: 'Someone else', placeholder: 'Who is it for?' },
] as const;
type Purpose = (typeof PURPOSES)[number]['id'];

/** "Who is it for?" → certificate ready, with a placeholder PDF. */
export function CertificateSheet({ policy, open, onClose }: { policy: Policy; open: boolean; onClose: () => void }) {
  const [purpose, setPurpose] = useState<Purpose>('client');
  const [recipient, setRecipient] = useState('');
  const [made, setMade] = useState<Certificate>();

  const close = () => {
    onClose();
    setTimeout(() => {
      setMade(undefined);
      setRecipient('');
      setPurpose('client');
    }, 300);
  };

  const create = () => {
    const cert: Certificate = { id: `cert-${Date.now()}`, policyId: policy.id, recipient: recipient.trim(), date: todayIso() };
    setState((s) => ({
      ...s,
      certificates: [cert, ...s.certificates],
      activity: [
        activityToday({ type: 'certificate', text: `${POLICY_LABEL[policy.type]} certificate for ${cert.recipient}`, policyId: policy.id }),
        ...s.activity,
      ],
    }));
    setMade(cert);
  };

  return (
    <BottomSheet open={open} onClose={close} title={made ? undefined : 'Who is it for?'}>
      {made ? (
        <SuccessView title="Certificate ready" lines={[`For ${made.recipient} · valid until ${formatDate(policy.renewalDate)}`]}>
          <Button size="lg" className="w-full" onClick={() => downloadCertificate(policy, made)}>
            Download PDF
          </Button>
          <Button size="lg" variant="link" className="w-full" onClick={close}>
            Done
          </Button>
        </SuccessView>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (recipient.trim()) create();
          }}
        >
          <RadioGroup value={purpose} onValueChange={(v) => setPurpose(v as Purpose)} className="gap-0">
            {PURPOSES.map((p) => (
              <Label key={p.id} htmlFor={`purpose-${p.id}`} className="flex cursor-pointer items-center justify-between py-3 text-base font-medium">
                {p.label}
                <RadioGroupItem id={`purpose-${p.id}`} value={p.id} />
              </Label>
            ))}
          </RadioGroup>
          <Input
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder={PURPOSES.find((p) => p.id === purpose)!.placeholder}
            className="mt-3"
          />
          <Button type="submit" size="lg" className="mt-5 w-full" disabled={!recipient.trim()}>
            Create certificate
          </Button>
        </form>
      )}
    </BottomSheet>
  );
}
