# Fase 2: app com a Trilha das Cores. Entrega e como testar

Entregue em 2026-10-28. O app roda no navegador do computador; a instalação no celular vem na Fase 5/6.

## O que foi construído

| Parte | Arquivos | O que faz |
|---|---|---|
| Casca do app | `src/App.tsx`, `src/AppContext.tsx`, `src/main.tsx`, `src/styles.css` | Carrega perfis e tentativas do banco, deriva o estado com o motor, navega entre telas |
| Banco local | `src/storage/db.ts`, `repo.ts`, `persist.ts` | IndexedDB (Dexie): perfis, tentativas, configurações, "Fizemos!". Pede armazenamento persistente |
| Relógio | `src/clock.ts` | Único lugar que lê a hora; aceita deslocamento para simulação |
| Narrador | `src/audio/*`, `src/content/speech.ts` | Catálogo de falas por chave; síntese só com vozes **locais**; arquivos gravados têm prioridade se existirem |
| Tela da criança | `src/child/*` | "Toca para começar" (libera áudio), ilhas, sessão, limite diário, celebração |
| Atividades de cores | `src/activities/colors/*` | PAREAR, RECONHECER, EVOCAR (modo com adulto); apresentação de item novo; erro sem punição; inatividade → repete → ajuda 1 → ajuda 2 |
| Ilustrações | `src/content/svg/*` | 31 formas originais em SVG (geométricas, frutas, animais, objetos), ilhas, avatares |
| Painel dos pais | `src/parent/*` | Gesto de acesso, perfis, progresso por etapa/item/degrau, configurações, **simulação** |

## Como testar (você)

Na pasta `E:\Claude\app-aprender`:

```bash
npm run dev
```

Abra no navegador o endereço que aparece (`http://localhost:5173/app-aprender/`). Para testar no celular na mesma rede Wi-Fi: `npm run dev -- --host` e abra o endereço "Network" no celular.

### Roteiro 1: primeira vez (5 min)
1. Aparece o **painel** pedindo o cadastro. Digite o nome, escolha um avatar, **Salvar**.
2. Tela "Toca para começar". Toque. Deve ouvir "Oi, {apelido}! Qual ilha você quer visitar hoje?".
3. Toque na ilha **Cores**. Começa o **nivelamento**: "Vamos ver o que você já conhece. Toca no vermelho." São 4 tentativas de C1; se acertar ≥ 80%, testa C2, e assim por diante.
4. Depois do nivelamento, a sessão: 2 aquecimentos, itens da etapa, até 16 tentativas ou 7 minutos. Observe:
   - **Item novo** aparece sozinho, grande, e o narrador o apresenta ("Esta é a cor azul. Azul!") antes de pedir resposta.
   - **Erro:** a opção certa brilha, as outras apagam, o narrador diz "Este é o azul! Toca nele para continuar". Nada de som de erro.
   - **Acerto:** elogio variado e animação de 1 s.
   - **Botão azul no canto inferior esquerdo:** repete a instrução.
   - **Fique parado 8 s:** o narrador repete; mais 8 s: some uma opção; mais 8 s: a certa pulsa.
5. Fim: estrela e "Muito bem!". Toque para voltar às ilhas.
6. Entre de novo nas Cores (2ª sessão). Entre uma 3ª vez: tela **"Hora de brincar lá fora!"** (limite diário 2).

### Roteiro 2: revisão espaçada na simulação (3 min)
1. Segure o **canto superior direito** por 3 segundos; responda a soma.
2. **Configurações** → marque "Mostrar a aba Simulação". Abra a aba **Simulação**.
3. Acerto em 100%, Sessões = 2, **Rodar**. Na tabela: `match` em prática, "1 dia ok".
4. **+1 dia**, Rodar 2 sessões. Agora `match` **mastered**, caixa 1, próxima revisão amanhã; `recognize` em prática.
5. **+1 dia**, Rodar 1 sessão. O registro diz "2 revisões"; `match` sobe para **caixa 2**; `recognize` fica mastered; a etapa atual passa a **C2** e os ativos a amarelo e verde.
6. Para ver o reforço: rode com acerto 0% por 1 sessão no dia de uma revisão: a habilidade erra a revisão e a segunda checagem e vai para `reinforcement`.
7. **Voltar ao real** zera o relógio. "Apagar progresso" limpa as tentativas do perfil.

### Roteiro 3: progresso
Aba **Progresso**: por trilha, cada etapa com estado; cada item com seus degraus (em prática · dias ok · dominada · caixa · data da revisão). Itens "ativo" são o conjunto ativo.

## Verificado por mim no navegador integrado
- Cadastro → início → ilhas → nivelamento (parou em C1 com 50%) → sessão com aquecimento e tentativas gravadas no IndexedDB.
- Fluxo de erro (certa brilha, outras apagam) e de acerto.
- Painel pelo gesto; simulação com o roteiro 2 acima, exatamente com os resultados descritos.
- `npm test`: 35 testes passando; `tsc` sem erros.

## Pendências desta fase
1. **Fonte Andika** ainda não está no app (os arquivos `public/fonts/Andika-*.woff2` não existem; o navegador avisa e usa a fonte do sistema). Preciso da sua autorização para baixar os arquivos da SIL. Para cores não faz diferença; para letras e números (Fases 3 e 4) é obrigatória.
2. **Ícones PNG** do PWA (192 e 512 px) ainda não gerados; existe só o SVG. Fica para a Fase 5.
3. Ilustrações são todas minhas, simples. Se quiser as do OpenMoji para frutas e animais, troco na Fase 5.

## Decisões tomadas
- **CSP só no build** (não em desenvolvimento), porque o Vite injeta scripts inline para recarga rápida. No app publicado a política vale integralmente.
- O **alvo é marcado no DOM** (`data-target`) **apenas em modo de desenvolvimento**, para testes automatizados; no build publicado isso não existe.
- Toques são **ignorados enquanto o narrador fala a instrução**; a síntese sem voz disponível libera em 0,6 s para não prender a criança.
