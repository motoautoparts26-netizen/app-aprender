# Fase 0: Plano, arquitetura e decisões

Projeto em `E:\Claude\app-aprender`. Especificação em `docs/ESPECIFICACAO.md`.

---

## 1. Como o app funciona (visão de uma página)

```
[a criança toca na tela] → Atividade (React) → registra Trial → IndexedDB (Dexie)
                                                 ↓
                                      Motor (src/engine) recalcula estado:
                                      domínio, caixas Leitner, reforço, conjunto ativo
                                                 ↓
                                      Motor monta a próxima tentativa / sessão
                                                 ↓
                                      Narrador fala a instrução (voz local do aparelho)
```

- **Só existe um dado de verdade:** a lista de tentativas (`Trial`). Tudo o mais é calculado a partir dela.
- O motor recebe a lista de tentativas e o relógio (`now`) e devolve o estado e a próxima sessão. Não sabe que existe tela, banco ou navegador. Por isso dá para testá-lo sem abrir o app e simular meses em segundos.
- A interface só faz duas coisas: mostrar o que o motor pediu e gravar o que a criança respondeu.

---

## 2. Arquitetura e pastas

```
app-aprender/
├── docs/                      especificação e planos
├── public/
│   ├── audio/                 mp3/m4a gravados (vazio na v1; a interface já procura aqui)
│   ├── fonts/Andika-*.woff2   fonte empacotada
│   └── icons/                 ícones do PWA
├── src/
│   ├── config/
│   │   └── pedagogy.ts        TODOS os parâmetros pedagógicos, comentados
│   ├── engine/                TypeScript puro. Proibido: React, Dexie, Date.now()
│   │   ├── types.ts           Trial, Skill, SkillState, Track, Stage, Item
│   │   ├── calendar.ts        chave de dia local (YYYY-MM-DD) a partir de `now`
│   │   ├── mastery.ts         dias qualificados/reprovados, variantes, domínio
│   │   ├── review.ts          caixas Leitner, próxima revisão, segunda checagem, reforço
│   │   ├── activeSet.ts       conjunto ativo, item encalhado
│   │   ├── progression.ts     etapa concluída, pré-requisitos, congelamento
│   │   ├── distractors.ts     escolha de distratores e proibição de pares confundíveis
│   │   ├── session.ts         montagem da sessão (ordem de prioridade da seção 9)
│   │   ├── placement.ts       nivelamento
│   │   ├── alerts.ts          alerta de visão de cores
│   │   ├── state.ts           deriveState(trials, content, now) → estado completo
│   │   └── __tests__/
│   │       ├── scenarios/     os 15 cenários de aceite, um arquivo cada
│   │       ├── profiles/      4 perfis simulados + gerador de trajetória
│   │       └── fixtures/
│   ├── content/
│   │   ├── colors.ts          etapas C1–C6, hex, tons, variantes, pares confundíveis
│   │   ├── letters.ts         L1–L6, pares confundíveis, banco de palavras da L6
│   │   ├── numbers.ts         N1–N6, pontos de verificação do traçado
│   │   ├── speech.ts          catálogo de falas (chave → texto pt-BR)
│   │   ├── offscreen.ts       sugestões fora da tela por etapa
│   │   └── svg/               ilustrações originais, um arquivo por objeto
│   ├── audio/
│   │   ├── AudioService.ts    interface: speak(key), replay(), unlock()
│   │   ├── FileAudio.ts       toca public/audio/{key}.mp3|m4a se existir
│   │   └── SpeechAudio.ts     Web Speech API, só vozes localService, rate 0.9
│   ├── storage/
│   │   ├── db.ts              Dexie: tabelas profiles, trials, settings, offscreenLog
│   │   ├── backup.ts          exportar/importar JSON
│   │   └── persist.ts         navigator.storage.persist(), avisos iOS
│   ├── activities/
│   │   ├── shared/            OptionGrid, Target, ReplayButton, Celebration, IdleWatcher
│   │   ├── MatchActivity.tsx
│   │   ├── RecognizeActivity.tsx
│   │   ├── RecallActivity.tsx         (modo com adulto)
│   │   ├── QuantityFlash.tsx          N1
│   │   ├── CountTogether.tsx          N2
│   │   └── TraceActivity.tsx          N4/N5
│   ├── child/                 tela inicial (ilhas), fluxo da sessão, tela de limite diário
│   ├── parent/                gate (segurar 3 s + conta), perfis, progresso, config, dev mode
│   ├── sim/                   relógio falso, auto-resposta (usa os perfis do engine)
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── vite.config.ts             base: '/app-aprender/', vite-plugin-pwa
├── vitest.config.ts
└── package.json
```

**Regra de dependência (verificada por teste):** `src/engine/` só importa de `src/engine/`, `src/config/` e `src/content/` (tipos). Nada mais.

---

## 3. Decisões técnicas

| Decisão | Escolha | Motivo |
|---|---|---|
| Framework | React 18 + TypeScript + Vite 5 | Conforme especificação |
| Estado da UI | React puro (useReducer + contexto) | O estado real vive no motor; não precisa de Redux/Zustand |
| Persistência | Dexie 4 | IndexedDB com API simples; `trials` indexada por `profileId+timestamp` |
| PWA | vite-plugin-pwa, estratégia `generateSW`, precache de tudo | Offline total após o primeiro carregamento |
| Fonte | Andika (SIL OFL) em woff2, só regular e bold | Formas sem ambiguidade (I, l, 1; a de um andar) |
| Áudio | Web Speech API filtrada por `localService` | Privacidade; voz do Google no Chrome é remota |
| Ilustrações | SVG próprio para formas, cestos, ilhas; OpenMoji (CC BY-SA) para objetos do cotidiano | Qualidade visual aceitável sem semanas de desenho; atribuição na tela Sobre |
| Testes | Vitest; sem testes de UI na v1 | O risco está no motor |
| Publicação | GitHub Pages via GitHub Actions | Grátis, HTTPS (obrigatório para PWA) |
| Datas | Chave de dia local; `now` sempre injetado | Cenário 15 |

---

## 4. Cores: códigos propostos

Critérios: saturação alta, longe de fronteiras entre categorias, legíveis sobre fundo `#F2F2F2`. Verifiquei contraste de luminância para que vermelho e verde **também** difiram em brilho (vermelho mais escuro), o que ajuda qualquer criança e torna o alerta de visão de cores mais conservador, não menos.

| Item | Hex | Justificativa |
|---|---|---|
| vermelho | `#E02020` | Vermelho puro ligeiramente escurecido; longe do laranja (#FF8000) e do rosa (#FF69B4) |
| azul | `#1F5FD6` | Azul médio; não puxa para ciano nem para roxo |
| amarelo | `#FFD400` | Amarelo pleno; evita o amarelo-esverdeado (#E6FF00) e o âmbar (#FFBF00) que já parece laranja |
| verde | `#1FA83C` | Verde folha; mais claro que o vermelho para separar por brilho; longe do verde-água |
| preto | `#1A1A1A` | Preto "real" cansa menos que #000 em tela |
| branco | `#FFFFFF` com contorno `#9A9A9A` de 3 px | Contorno obrigatório sobre fundo claro |
| laranja | `#FF8A1F` | Entre vermelho e amarelo, a distância igual dos dois |
| roxo | `#7A3FBF` | Roxo médio; não confunde com azul (#1F5FD6) nem com rosa |
| rosa | `#FF6FAE` | Rosa saturado, mais claro que o vermelho; distante do roxo |
| marrom | `#8B5A2B` | Marrom quente; escuro o bastante para não virar laranja escuro |
| cinza | `#8E8E8E` | Cinza médio; mais escuro que o fundo e o contorno do branco |

### Tons da C5 (variantes "ainda é X")

| Cor | Claro 1 | Claro 2 | Escuro 1 | Escuro 2 | Evitado (invade outra categoria) |
|---|---|---|---|---|---|
| vermelho | `#F05A5A` | `#F27A7A` | `#B81818` | `#8F1010` | mais claro vira rosa; mais escuro com laranja vira marrom |
| azul | `#5B8BE6` | `#8FB0F0` | `#15449E` | `#0F2F6E` | azul-claro muito saturado vira ciano; `#8FB0F0` é o limite |
| amarelo | `#FFE266` | `#FFF0A3` | `#E6BE00` | `#CCA800` | escurecer mais vira mostarda/laranja |
| verde | `#5FC46F` | `#9ADBA3` | `#157A2A` | `#0F5A1E` | puxar para azul vira verde-água |
| laranja | `#FFA85C` | `#FFC28F` | `#E07010` | — | escuro 2 omitido: vira marrom |
| roxo | `#A06FD6` | `#C39BE6` | `#5C2E99` | `#43226F` | puxar para vermelho vira rosa/magenta |
| rosa | `#FF9BC7` | `#FFC2DE` | `#E6508F` | — | escuro 2 omitido: vira vermelho/magenta |
| marrom | `#A9743F` | `#C4915E` | `#6B4420` | `#4E3017` | claro 2 é o limite antes de virar bege/laranja |
| cinza | `#B5B5B5` | `#D0D0D0` | `#6A6A6A` | `#4A4A4A` | claro 2 é o limite antes de virar branco |

Preto e branco não têm tons na C5.

---

## 5. Plano de fases (ajustado para publicar Cores primeiro)

| Fase | Entrega | Como você vai testar |
|---|---|---|
| **1** | Motor + 15 cenários + 4 perfis simulados | `npm test` passa; eu mostro o relatório de trajetória de cada perfil |
| **2** | App com Cores, narrador, ilhas, painel básico, simulação | No navegador do PC e no celular (rede local): completar C1 e C2 na simulação; avançar o relógio e ver a revisão aparecer |
| **2b (novo)** | **Publicação antecipada** da versão só com Cores no GitHub Pages | Instalar no celular e a criança usar de verdade |
| **3** | Números com traçado | Traçar com o dedo no tablet; testar espelhamento |
| **4a** | Letras L1–L5: toca na letra igual, trem do alfabeto, montar palavra copiando o modelo, detetive do nome, nomes da família | Cadastrar o nome e ver L1 com as letras dele; cada atividade registra tentativas que passam pelo critério de domínio |
| **4b** | Letras L6: caixa surpresa das iniciais e cadê o meu par, com as 48 figuras | Figuras legíveis no celular; palavras com som inicial regular |
| **5** | Sugestões, limite diário, backup, avisos iOS, alerta de cores | Painel |
| **6** | Publicação final e instruções de instalação | Link, instalar, usar offline |

Cada fase termina com instruções de teste e pausa para sua revisão.

---

## 6. Pré-requisito encontrado

**Node.js não está instalado neste computador** (`node` e `npm` não foram encontrados; `git` está). Sem ele não há como rodar nem construir o app. Instalação: baixe o **Node.js LTS** em https://nodejs.org (instalador `.msi` para Windows, 64 bits), aceite as opções padrão. Depois me avise e eu confirmo com `node --version`.

Se preferir que o Node fique no disco E:, o instalador permite escolher a pasta de destino; ele ocupa cerca de 100 MB.

---

## 7. Perguntas (5)

1. **Tablet:** é Android ou iPad? Muda o tratamento de armazenamento e áudio.
2. **Conta no GitHub:** você já tem (usuário)? Se não, posso te guiar para criar; é gratuita e necessária para o GitHub Pages.
3. **Nome e apelido:** o primeiro nome vai para a L1. O narrador chama a criança pelo nome ou por algum apelido?
4. **Voz:** você aceita que, se o celular não tiver voz pt-BR local, o app use a voz local disponível (que pode soar estranha) e avise no painel, em vez de usar a voz remota do Google? A especificação diz sim; só confirmo porque afeta a experiência.
5. **Ilustrações:** confirma OpenMoji para objetos (morango, bola, carrinho) com atribuição na tela Sobre, ou prefere tudo desenhado por mim em SVG (mais simples visualmente)?

---

Aguardo sua aprovação deste plano e as respostas para iniciar a Fase 1.
