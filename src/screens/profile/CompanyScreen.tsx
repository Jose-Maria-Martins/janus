import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PushScreen } from '@/components/Screen';
import { useStore } from '@/data/store';
import { formatEUR, formatNif } from '@/lib/format';

/** What Janus knows about the company, as found from the NIF. Changes go through the team. */
export function CompanyScreen() {
  const { company } = useStore();

  return (
    <PushScreen title="Company details">
      <Card className="mt-2 gap-0 px-4 py-1.5">
        <dl>
          <Row label="Name" value={company.name} />
          <Row label="NIF" value={formatNif(company.nif)} />
          <Row label="Sector" value={`${company.sector} (CAE ${company.cae})`} />
          <Row label="City" value={company.city} />
          <Row label="People" value={String(company.employees)} />
          <Row label="Payroll" value={`${formatEUR(company.annualPayroll)} a year`} />
          <Row label="Revenue" value={company.revenueBand} />
        </dl>
      </Card>
      <p className="mt-4 px-1 text-sm text-muted-foreground">Found from your NIF. Insurers use these to price your policies.</p>
      <Button asChild variant="link" className="mt-2 px-1">
        <Link to="/ask?with=person">Something wrong? Chat with us</Link>
      </Button>
    </PushScreen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
