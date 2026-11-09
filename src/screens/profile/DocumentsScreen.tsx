import { BadgeCheck, FileText } from 'lucide-react';
import { DocRow } from '@/components/DocRow';
import { PushScreen, Widget } from '@/components/Screen';
import { insurerById } from '@/data';
import { useStore } from '@/data/store';
import { formatDate } from '@/lib/dates';
import { downloadCertificate, downloadPolicy } from '@/lib/documents';
import { POLICY_LABEL } from '@/lib/format';

/** Every policy document and every certificate made in the app, in one place. */
export function DocumentsScreen() {
  const { policies, certificates } = useStore();

  return (
    <PushScreen title="Documents">
      <Widget title="Policies">
        {policies.map((p) => (
          <DocRow
            key={p.id}
            icon={<FileText />}
            title={`${POLICY_LABEL[p.type]} · ${insurerById(p.insurerId).name}`}
            subtitle={`Policy ${p.policyNumber}`}
            onClick={() => downloadPolicy(p)}
          />
        ))}
      </Widget>

      <Widget title="Certificates">
        {certificates.length === 0 && <p className="px-3 pt-1 pb-3 text-sm text-muted-foreground">Certificates you make from a policy page show up here.</p>}
        {certificates.map((c) => {
          const policy = policies.find((p) => p.id === c.policyId);
          return (
            policy && (
              <DocRow
                key={c.id}
                icon={<BadgeCheck />}
                title={`Certificate for ${c.recipient}`}
                subtitle={`${POLICY_LABEL[policy.type]} · ${formatDate(c.date)}`}
                onClick={() => downloadCertificate(policy, c)}
              />
            )
          );
        })}
      </Widget>
    </PushScreen>
  );
}
