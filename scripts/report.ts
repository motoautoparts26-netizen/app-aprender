/**
 * Gera docs/RELATORIO-PERFIS.md com a trajetória dia a dia de cada perfil simulado.
 * Uso: npm run report
 */
import { writeFileSync } from 'node:fs';
import { DEFAULT_PEDAGOGY } from '../src/config/pedagogy';
import { buildContent } from '../src/content';
import { formatTrajectory, PROFILES, simulate } from '../src/engine/simulate';

const content = buildContent({ childName: 'Teste' });
const start = new Date(2026, 0, 5, 10, 0, 0, 0).getTime();
const tracks = ['colors', 'letters', 'numbers'] as const;

const runs: [string, ReturnType<typeof simulate>][] = [
  ['Aprende rápido (30 dias, 2 sessões/dia, 3 trilhas)', simulate({ profile: PROFILES.fast, content, params: DEFAULT_PEDAGOGY, tracks: [...tracks], days: 30, sessionsPerDay: 2, seed: 101, start })],
  ['Aprende devagar (30 dias)', simulate({ profile: PROFILES.slow, content, params: DEFAULT_PEDAGOGY, tracks: [...tracks], days: 30, sessionsPerDay: 2, seed: 101, start })],
  ['Esquece e entra em reforço (60 dias)', simulate({ profile: PROFILES.forgetful, content, params: DEFAULT_PEDAGOGY, tracks: [...tracks], days: 60, sessionsPerDay: 2, seed: 101, start })],
  ['Confunde vermelho e verde (10 dias, só Cores)', simulate({ profile: PROFILES.redGreen, content, params: DEFAULT_PEDAGOGY, tracks: ['colors'], days: 10, sessionsPerDay: 2, seed: 101, start })],
];

const header = [
  '# Relatório de trajetória dos perfis simulados',
  '',
  'Gerado por `npm run report`. Nome da criança nos testes: "Teste" (fictício). Semente fixa: os números são reproduzíveis.',
  '',
  'Legenda: `etapa` = etapa atual por trilha · `dominou` = habilidades que alcançaram domínio no dia · `REFORÇO` = erraram duas revisões · `congelado` = etapa concluída mas próxima bloqueada por reforço.',
  '',
];
const body = runs.map(([name, res]) => formatTrajectory(name, res)).join('\n');
writeFileSync('docs/RELATORIO-PERFIS.md', header.join('\n') + '\n' + body, 'utf8');
console.log('docs/RELATORIO-PERFIS.md gerado.');
for (const [name, res] of runs) {
  const mastered = Object.values(res.finalState.skills).filter((s) => s.status === 'mastered' || s.status === 'provisional').length;
  console.log(`- ${name}: ${mastered} habilidades dominadas, ${res.finalState.alerts.length} alerta(s)`);
}
