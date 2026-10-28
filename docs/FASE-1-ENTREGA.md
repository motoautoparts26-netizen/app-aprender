# Fase 1: motor pedagógico. Entrega e como testar

Entregue em 2026-10-28. Sem interface ainda: tudo é verificado por testes automatizados e pelo relatório de trajetória.

## O que foi construído

| Módulo | Arquivo | O que faz |
|---|---|---|
| Parâmetros | `src/config/pedagogy.ts` | Todos os números pedagógicos, comentados |
| Tipos | `src/engine/types.ts` | Tentativa (`Trial`), item, etapa, estado derivado, `Slot` |
| Calendário | `src/engine/calendar.ts` | Dia local com corte à meia-noite; `now` sempre por parâmetro |
| Domínio e revisão | `src/engine/mastery.ts` | Dias qualificados/reprovados, variantes, caixas Leitner, segunda checagem, reforço |
| Derivação | `src/engine/state.ts` | Recalcula tudo a partir do log de tentativas: habilidades, itens, etapas, conjunto ativo, encalhados, congelamento, nivelamento |
| Distratores | `src/engine/distractors.ts` | Ordem de preferência e proibição de pares confundíveis |
| Sessão | `src/engine/session.ts` | Monta a sessão tentativa a tentativa, com aquecimento, fechamento, prioridades, retorno com dica, proteção contra frustração |
| Nivelamento | `src/engine/placement.ts` | Jogo de nivelamento com parada na primeira etapa abaixo de 80% |
| Alerta | `src/engine/alerts.ts` | Alerta de visão de cores |
| Simulação | `src/engine/simulate.ts` | Criança simulada (4 perfis) e relatório de trajetória |
| Conteúdo | `src/content/{colors,letters,numbers}.ts` | Etapas, itens, variantes, pares confundíveis, caminhos de traçado |

## Como testar (você)

Todos os comandos na pasta `E:\Claude\app-aprender`, no terminal (PowerShell ou o terminal do Claude).

### 1. Rodar os testes
```bash
npm test
```
Esperado: `Test Files 6 passed`, `Tests 35 passed`. Os 15 cenários de aceite da seção 17 estão em `src/engine/__tests__/scenarios/` com o número do cenário no nome do teste. Os perfis simulados estão em `src/engine/__tests__/profiles/`.

### 2. Gerar o relatório de trajetória
```bash
npm run report
```
Abre `docs/RELATORIO-PERFIS.md`. O que observar:
- **Aprende rápido:** domina `red:match` e `blue:match` no dia 2 (dois dias qualificados), passa para C2 no dia 7.
- **Aprende devagar:** mesma sequência, cerca de 2× mais lenta (C2 no dia 14).
- **Esquece:** no dia 23 aparece `REFORÇO: green:match` e `congelado: colors` com `colors=—`. A trilha fica congelada até o reforço acabar. No dia 49 aparecem itens **encalhados**.
- **Confunde vermelho e verde:** `ALERTA: color-vision` a partir do dia 2; nenhum outro perfil tem alerta.

### 3. Conferir que nada avança sem critério
No relatório, uma etapa só muda (ex.: `colors=C1` → `colors=C2`) no dia em que a **última habilidade** daquela etapa aparece em `dominou`. Nunca antes.

## Decisões tomadas durante a fase

1. **Pares de cores em dois grupos** (especificação atualizada, 12.1): pares de categoria (azul↔roxo etc.) nunca juntos antes de C5; pares de visão de cores (vermelho↔verde etc.) podem aparecer juntos desde C1, senão o alerta nunca teria dados.
2. **L6 permite pares confundíveis na tela**, porque as opções são figuras de palavras, não letras.
3. **Reforço limitado a 6 tentativas por sessão por habilidade** (`REINFORCEMENT_MAX_PER_SESSION`), para ter prioridade sem tomar a sessão inteira.
4. **Revisão vence à meia-noite** do dia previsto, não na hora exata do domínio. Assim, uma sessão de manhã já encontra as revisões do dia.
5. **Nivelamento: só a última rodada vale.** Refazer pelo painel substitui o provisório anterior, mantendo o log.
6. **A evocação (EVOCAR) e o traçado não têm opções na tela**, então a regra de 4 opções não se aplica a eles; valem só dias qualificados e, no traçado, 3 tentativas por dia.

## Observação para você

Com **3 trilhas e 2 sessões por dia**, cada trilha recebe cerca de 2/3 de sessão por dia, e o progresso em cada uma fica lento (a criança rápida leva 7 dias para fechar C1 e, no mesmo período, só domina 1 letra). Isso é consequência direta das regras (2 dias qualificados por habilidade), não um defeito. Se quiser acelerar as cores no início, dá para desativar as outras trilhas no painel temporariamente.

## Não feito nesta fase (planejado)
- Interface, banco de dados, áudio, PWA: Fases 2 em diante.
- Git: o projeto ainda não tem repositório iniciado. Faço isso na Fase 2, antes do primeiro código de interface.
