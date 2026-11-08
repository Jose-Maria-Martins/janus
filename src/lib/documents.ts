import { insurerById } from '../data';
import { getState } from '../data/store';
import type { Certificate, Policy } from '../types';
import { formatDate } from './dates';
import { formatEUR, POLICY_LABEL } from './format';
import { downloadPdf } from './pdf';
import { coverName, FREQUENCY_LABEL } from './policy';

/** Placeholder PDFs: the policy document and certificates. */
export function downloadCertificate(policy: Policy, cert: Certificate) {
  const { company } = getState();
  downloadPdf(`certificate-${policy.policyNumber}.pdf`, 'Certificate of insurance', [
    `Issued for: ${cert.recipient}`,
    `Date: ${formatDate(cert.date)}`,
    '',
    `Policyholder: ${company.name} (NIF ${company.nif})`,
    `Insurer: ${insurerById(policy.insurerId).name}`,
    `Cover: ${POLICY_LABEL[policy.type]}`,
    `Policy number: ${policy.policyNumber}`,
    `Valid from ${formatDate(policy.startDate)} to ${formatDate(policy.renewalDate)}`,
    '',
    'This certificate confirms the policy above is in force on the date of issue.',
    'Demo document made with Janus.',
  ]);
}

export function downloadPolicy(policy: Policy) {
  const { company } = getState();
  downloadPdf(`policy-${policy.policyNumber}.pdf`, `${POLICY_LABEL[policy.type]} policy`, [
    `Policy number: ${policy.policyNumber}`,
    `Insurer: ${insurerById(policy.insurerId).name}`,
    `Policyholder: ${company.name} (NIF ${company.nif})`,
    `Annual premium: ${formatEUR(policy.annualPremium)} (${FREQUENCY_LABEL[policy.paymentFrequency].toLowerCase()})`,
    `From ${formatDate(policy.startDate)} to ${formatDate(policy.renewalDate)}`,
    '',
    "What's covered:",
    ...policy.covered.map((c) => `  - ${coverName(c.name, policy, company)}${c.limit ? `, limit ${c.limit}` : ''}${c.deductible ? `, deductible ${c.deductible}` : ''}`),
    '',
    "What's not covered:",
    ...policy.notCovered.map((n) => `  - ${n}`),
    '',
    'Demo document made with Janus.',
  ]);
}
