/**
 * Nível de comprometimento da renda mensal:
 * - 'GREEN': até 40% (saudável)
 * - 'YELLOW': entre 40% e 70% (atenção moderada)
 * - 'RED': acima de 70% (alerta crítico)
 * - 'GRAY': renda mensal zerada ou não configurada (informativo/neutro, sem alarme)
 */
export type CommitmentLevel = 'GREEN' | 'YELLOW' | 'RED' | 'GRAY';

export interface FutureCommitmentThermometer {
  monthKey: string;
  totalCommittedCents: number;
  totalProjectedIncomeCents: number;
  commitmentPercentage: number;
  level: CommitmentLevel;
  feedbackMessage: string;
}
