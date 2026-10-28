# Fase 4a: Trilha das Letras (L1–L5). Entrega e como testar

Entregue em 2026-10-28, antes da Fase 3 (Números) a pedido da responsável.

## O que foi construído

| Parte | Arquivos | O que faz |
|---|---|---|
| Atividade genérica de escolha | `src/activities/shared/ChoiceActivity.tsx` | Base única para cores e letras: apresentação → (modelo + nomeação) → instrução → resposta → elogio ou "a certa brilha". Inatividade, ajudas, toques ignorados durante a fala |
| Letras em Andika | `src/activities/letters/LetterTile.tsx` | Letra grande em cor neutra (preto, grafite, marinho), tamanhos por variante, pontilhado, palavra com letra destacada |
| Escolha da atividade | `src/activities/letters/LetterActivities.tsx` | A partir do Slot do motor decide a "roupa": toca na letra igual, trem, montar palavra, detetive, evocar |
| **Trem do alfabeto** | idem | 4 estações com placas, trilho, trem que anda até a estação tocada e apita ("Piuí! O trem chegou!") |
| **Montar palavra copiando o modelo** | idem | Palavra pontilhada em cima, casinhas embaixo com uma vazia (a letra-alvo), 4 letras para escolher; a letra entra na casinha e o narrador lê a palavra |
| **Detetive do nome** | `src/activities/letters/NameDetective.tsx` | Nome em casinhas, preenchido da esquerda para a direita; com modelo pontilhado até todas as letras serem dominadas, depois sem. Cada casinha é uma tentativa da letra correspondente |
| Nomes da família | `src/parent/ProfilesTab.tsx` | Até 6 nomes por perfil; entram no detetive quando todas as suas letras já foram apresentadas |
| Tentativas extras | `src/engine/session.ts` (`recordExtra`), `SessionScreen.tsx` | Atividades compostas registram uma tentativa por letra |
| Banco de palavras | `src/content/letters.ts` (`WORD_BANK`, `wordsFor`) | 61 palavras curtas; só entram as que contêm a letra-alvo e usam letras já apresentadas |

O motor pedagógico **não mudou** (só ganhou `recordExtra`). Testes: 40/40.

## Como testar (você)

```bash
npm run dev
```
(ou `npm run dev -- --host` para o celular). Entre na ilha **Letras**.

### Roteiro 1: primeira vez
1. **Nivelamento**: "Vamos ver o que você já conhece. Toca na letra dê." 4 tentativas por etapa (L1: letras do nome; L2: vogais…), para na primeira etapa abaixo de 80%.
2. Sessão em L1 (as letras do nome). Nas primeiras vezes cada letra é **apresentada** sozinha ("Esta é a letra dê. Dê!").
3. **Toca na letra igual**: a letra-modelo aparece sozinha, "Esta é a letra dê.", depois as 4 opções e "Toca na letra igual a esta."
4. **Detetive do nome** (aparece em cerca de 60% das tentativas de parear em L1, depois que todas as letras do nome já foram apresentadas): "Vamos montar o seu nome!" As casinhas do nome com o modelo pontilhado em cima; a criança toca a letra de cada casinha em ordem. No fim: "Olha! O seu nome!"
5. Quando uma letra tem PAREAR dominado, começa o RECONHECER: **Trem do alfabeto** em ~65% das vezes ("O trem vai para a estação da letra dê. Toca na estação!") ou "Toca na letra dê."
6. A partir de L3, nas tentativas de parear: **Montar palavra** (~60%) com palavras como SOL, UVA, OVO, usando só letras já vistas.

### Roteiro 2: nomes da família
Painel → **Perfis** → ao lado do perfil, "Nomes da família": adicione "mamãe" (vira M, A, E), "vovó" etc. Eles entram no detetive quando todas as suas letras já tiverem sido apresentadas à criança (por isso no começo só o nome dela aparece).

### Roteiro 3: ver no painel
Progresso → Letras: L1 com as letras do nome; cada letra com parear/reconhecer e dias ok. Na simulação, a tabela mostra as tentativas por letra; no detetive, cada letra do nome ganha uma linha.

## Verificado por mim no navegador
- Nivelamento de letras com Andika e voz Maria.
- **Montar palavra**: SOL (casinha do L), SUCO (casinha do C), VELA (casinha do V): a letra entra na casinha e a palavra é lida.
- **Detetive**: T → E → S em ordem com o modelo pontilhado; depois de dominadas, sem modelo; 4 letras ficam na tela o tempo todo (cada casinha conta para o domínio).
- **Trem**: 4 estações, trem sai da esquerda e chega à estação tocada (`arrived`), todas as letras do mesmo tamanho.
- Fluxo de erro e acerto, inatividade, "ouvir de novo".

## Decisões e detalhes
1. **Toque, não arraste**, em todas as atividades (seção 1).
2. **Mesmo tamanho para todas as opções**: a variante de tamanho vale para a tela toda; se só o alvo fosse maior, o tamanho denunciaria a resposta.
3. No **detetive**, as letras continuam na tela depois de usadas, para cada casinha ter ≥ 4 opções e contar para o domínio. Nome com letra repetida (ex.: "Teste") é reduzido às letras únicas, como na L1.
4. Aquecimento e brincadeira livre com letras dominadas de L1 também podem vir como detetive sem modelo; é prática, não altera o estado.
5. **Montar palavra** só a partir de L3 e só com palavras cujas letras já foram apresentadas; se não houver palavra possível, cai em "toca na letra igual".
6. L5 (pares parecidos) usa só "toca na letra igual/toca na letra": lá o foco é a discriminação fina, sem distração do trem.

## Pendente para a Fase 4b
L6 (letra e som inicial) com **caixa surpresa** e **cadê o meu par**, que precisam das 48 figuras do banco de palavras.
