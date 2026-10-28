# Fase 3: Trilha dos Números com traçado. Entrega e como testar

Entregue em 2026-10-28 (depois das Fases 4a e 4b, a pedido da responsável).

## O que foi construído

| Parte | Arquivos | O que faz |
|---|---|---|
| Cartões de quantidade | `src/activities/numbers/QuantityCard.tsx` | N objetos (bolinhas, maçãs, estrelas, balões) em arranjos (linha, triângulo, espalhado, dado); zero = pratinho vazio |
| Numerais | `src/activities/numbers/NumeralTile.tsx` | Número grande em Andika, cor neutra |
| **N1: quantidade de relance** | `NumbersActivity.tsx` (`QuantityFlash`) | "Olha bem!" → cartão por 1,5 s → some → "Toca no que tem a mesma quantidade" entre 4 cartões com aparências diferentes |
| **N1: reconhecer quantidade** | idem | "Toca no que tem três" |
| **N2: contar junto** | idem (`CountTogether`) | A criança toca cada objeto; ele acende e o narrador conta; depois "Tem três! Toca no grupo que tem três" |
| **N3/N5: símbolo** | idem | Parear numeral (modelo sozinho + nomeação, como nas cores), "Toca no número três", "Toca no grupo que tem três" |
| **N6: zero e pares** | idem | "Zero é nenhum. Toca no grupo que não tem nenhum"; 6/9, 2/5, 1/7 juntos pela primeira vez |
| **N4/N5: traçado** | `TraceActivity.tsx` | Demonstração animada (ponto percorre o número), ponto inicial verde, a criança traça com o dedo; guia completa → pontilhada → só o ponto; **direção e sequência**, tolerância ampla; **espelhamento aceito e registrado** |
| Avaliação do traçado | `evaluateTrace` + `__tests__/trace.test.ts` | Pontos de verificação em ordem, começo perto do ponto verde, espelho horizontal, dois traços (4 e 10) |

Motor inalterado. Testes: 46/46 (5 novos do traçado: traço tremido aceito, espelho aceito e registrado, direção contrária recusada, rabisco recusado, dois traços).

## Como testar (você)

Mais rápido pela **prévia** (painel → Simulação → Prévia de atividades), item por item:

| Item | Degrau | O que ver |
|---|---|---|
| `N1 · dois (qty-2)` | `match` | "Olha bem!", cartão com 2, some, 4 cartões; o certo tem 2 com outra aparência |
| `N2 · três (count-3)` | `recognize` | Toque em cada objeto: acende e conta "um, dois, três"; depois os cartões |
| `N3 · três (num-3)` | `match` / `recognize` / `recognize-qty` | Número sozinho → nomeação → opções; "Toca no número três"; "Toca no grupo que tem três" |
| `N4 · dois (trace-2)` | `trace-guided` | Demonstração, ponto verde, trace com o dedo por cima; depois `trace-dotted` e `trace-free` |
| `N6 · zero (num-0)` | `recognize-qty` | "Zero é nenhum…", um cartão vazio entre os cheios |

No traçado: tente tremido (aceita), tente **espelhado** (aceita; o painel registra), tente de baixo para cima (não aceita: "Vamos ver de novo e tentar outra vez", e o motor traz o número de volta com guia). Fique 8 s parado: repete; 16 s: aparece a guia pontilhada; 24 s: a guia completa.

Pela ilha **Números**: nivelamento (N1 de relance, N2 e N3 reconhecer) e sessão normal.

## Verificado por mim no navegador
- Relance: cartão some e vira "?", 4 cartões, alvo com a quantidade certa.
- Contar junto: 3 objetos, acendem ao toque, cartões depois.
- Parear numeral, zero com cartão vazio.
- Traçado: guia do 2 com ponto verde; traço correto aceito; direção contrária recusada; dois traços (4) e espelho (3) conferidos pela avaliação.

## Decisões
- **Toque, não arraste**, em tudo menos no traçado (que é o próprio dedo desenhando).
- O 5 é desenhado num traço só (mais fácil para a criança); 4 e 10 em dois traços.
- Tolerância `TRACE_TOLERANCE_PX = 40` (≈ 13 unidades na caixa de 100). Ajustável em `pedagogy.ts`.
- Erro no traçado: o narrador diz "Vamos ver de novo e tentar outra vez" e a sessão segue; o motor traz o número de volta 2–4 tentativas depois com guia (ajuda), como nas outras trilhas.
- Objetos com cor "arbitrária" (bolinhas, balões) e típicas (maçã vermelha, estrela amarela); nada que confunda cor com quantidade.
