# Projeto: App de aprendizagem de cores, letras e números para crianças de 3 a 6 anos (v2 do prompt)

Você vai construir, do zero, um aplicativo educacional para uma criança de 4 anos que tem dificuldade em diferenciar cores, letras do alfabeto e a grafia dos números. O app precisa ser pedagogicamente rigoroso: ele **só avança de etapa quando há evidência sólida de que a criança domina a etapa anterior** e **revisa periodicamente o que já foi aprendido**.

Leia este documento inteiro antes de escrever qualquer código. Ele é a especificação do produto. Onde houver número ou regra, trate como requisito; onde houver "sugestão", use seu julgamento. Onde houver conflito entre duas regras, **pare e me pergunte**; não resolva inventando.

---

## 0. Como quero que você trabalhe

1. **Pasta do projeto:** crie tudo em `E:\Claude\app-aprender`. Nunca crie arquivos fora dela.
2. **Primeiro, planeje.** Leia tudo, proponha a arquitetura, a estrutura de pastas e o plano de fases. Se algo for realmente ambíguo, faça **no máximo 5 perguntas** objetivas. Aguarde minha aprovação antes de codar. As respostas às perguntas mais prováveis já estão na seção 0.1.
3. **Trabalhe em fases** (seção 18). Ao fim de cada fase: rode os testes, rode o app, me diga **exatamente como testar** (o que clicar, o que observar) e pare para minha revisão.
4. **O motor pedagógico é o coração do app.** TypeScript puro, sem dependência de interface, coberto por testes automatizados e pelos cenários de aceite da seção 17. Se o motor estiver errado, o app inteiro falha no seu propósito.
5. **Conteúdo é dado, não código.** Itens, etapas, palavras, figuras e sugestões de atividades ficam em arquivos de dados, para que eu possa acrescentar conteúdo sem mexer na lógica.
6. Todos os **parâmetros pedagógicos** ficam centralizados em `src/config/pedagogy.ts`, com um comentário explicando cada um. Nenhum número pedagógico aparece solto no código.
7. Código, nomes de variáveis e comentários em **inglês**. **Todo texto e áudio voltado ao usuário é em português do Brasil.**
8. **Escopo:** implemente a **v1** (seção 2). Deixe a arquitetura preparada para a v2, mas não implemente nada da v2 sem eu pedir.

### 0.1 Respostas antecipadas para a Fase 0
- **Nome da criança:** não está neste documento. O app pede o nome no primeiro uso, no painel. Não deixe nome fixo no código.
- **Aparelhos:** celular Android primeiro; tablet Android depois. Trate iOS como possível, sem prioridade de teste.
- **Gerenciador de pacotes:** `npm`. Node LTS atual.
- **Publicação:** GitHub Pages. Configure o `base` do Vite para funcionar em subpasta desde o início.
- **Ilustrações:** SVG original feito por você. Pode usar **OpenMoji** (CC BY-SA 4.0) ou **Twemoji** (CC BY 4.0) para objetos e animais, desde que inclua a atribuição numa tela "Sobre" do painel. Nenhum personagem de marca.

---

## 1. Público e princípios inegociáveis

- **Usuário principal:** criança de 3 a 6 anos, que **não lê**. Toda instrução para a criança é **falada** por um narrador. Nenhuma tela da criança depende de texto.
- **Usuário secundário:** pai, mãe ou responsável, que acessa um **painel protegido**.
- **Sessões curtas:** 5 a 8 minutos.
- **Sem punição:** nada de som de "errado", tela vermelha, perda de pontos, vidas ou "game over".
- **Sem mecânicas de vício:** sem anúncios, caixas-surpresa, roletas, sequências diárias que "quebram", notificações ou cronômetros visíveis para a criança.
- **Privacidade total:** nenhum dado sai do dispositivo. Sem analytics, sem login, sem servidor. Isso inclui a síntese de voz: só vozes **locais** (seção 13).
- **Visual calmo:** paleta suave fora das atividades de cor, poucos elementos por tela, animações curtas, celebrações de 1 a 2 segundos.
- **Toque, não arraste:** a interação padrão é **tocar**. Arrastar aparece só como variação opcional na trilha de cores e nunca gera registro de erro por soltura imprecisa. Motivo: arrastar com precisão é difícil aos 3–4 anos e briga com o gesto de rolagem.
- **Toque fácil:** alvos com no mínimo 64 px, espaçados, tolerância a toques duplos (segundo toque em 300 ms é ignorado).
- **Toques durante a instrução são ignorados:** enquanto o narrador fala a instrução, a tela não aceita resposta. Um toque antes de ouvir a instrução é chute, não resposta.
- **Inatividade:** `IDLE_REPEAT_SECONDS = 8` sem resposta → repete a instrução. Mais 8 s → sobe para ajuda nível 1 (seção 10), **sem registrar erro**. Mais 8 s → ajuda nível 2. Nada disso conta como tentativa falha.
- **Funciona em celular e tablet,** retrato e paisagem, e **offline** depois do primeiro carregamento.
- **Nenhum personagem, marca ou imagem protegida por direitos autorais.**

---

## 2. Escopo: v1 e v2

**v1 (este trabalho):**
- Trilhas **Cores**, **Letras** e **Números** (com traçado).
- Motor pedagógico completo, painel, nivelamento, modo de simulação.
- Limite diário, sugestões de atividades fora da tela, backup/importação, PWA offline.
- Alerta de **possível dificuldade na visão de cores** (é a queixa central, e é barato).
- Celebração de fim de sessão simples (uma estrela animada e o narrador parabenizando), sem álbum.

**v2 (não implementar agora, mas não impedir):**
- Trilha dos **Sons** (consciência fonológica) com banco de 60 palavras ilustradas.
- **Gravação da voz do responsável** para substituir a síntese.
- **Álbum de figurinhas** (1 figurinha por sessão concluída, independentemente do acerto, sem aleatoriedade).
- Alerta de **estagnação ampla**.
- Fonemas isolados gravados.
- **Trilha das Palavras** (liberada quando Letras e Sons estiverem dominadas), com estas etapas, nesta ordem:
  1. **Palavra quebrada:** completar a letra que falta (B _ L A), com figura.
  2. **Montar sem modelo:** a partir da figura, montar a palavra com letras móveis.
  3. **Caça ao tesouro:** achar as letras de uma palavra numa cena com distratores.
  4. **Pizzaria das palavras:** pedido falado ("pizza de GATO"), montar a palavra.
  5. **Palavra maluca:** corrigir uma palavra com letras trocadas (BAOL → BOLA).
  6. **Laboratório de palavras:** trocar uma letra para formar outra palavra (PATO → GATO → RATO → MATO).
  - Nessa trilha, vogais e consoantes **podem** ter cores diferentes (azul/vermelho, como no alfabeto móvel).
  - Itens = palavras do banco; degraus a definir na v2 (completar → montar com modelo → montar sem modelo). Critério de domínio igual ao da seção 6, adaptado para "palavra".
  - Atividades de 6 anos do material de inspiração (cofre secreto com pistas, desafio de 1 minuto, diretor de histórias) ficam **fora**: dependem de leitura fluente, cronômetro (vedado na seção 1) ou criação livre que o app não consegue avaliar; valem como sugestões fora da tela.

O que "preparado para a v2" significa na prática: a interface de áudio aceita arquivo gravado por chave (seção 13); o tipo `Track` não assume que toda trilha tem os três degraus; o registro de tentativa tem campo `trackId` genérico; a recompensa de fim de sessão é um componente trocável.

---

## 3. Stack técnica

Use esta stack, a não ser que tenha um motivo forte para outra (justifique na Fase 0):

- **React + TypeScript + Vite**
- **PWA instalável e offline** (`vite-plugin-pwa`)
- **IndexedDB** via **Dexie** para persistência local. Chame `navigator.storage.persist()` no primeiro uso. No iOS, Safari pode apagar dados de um site não instalado após 7 dias sem uso; o painel deve mostrar um aviso para **instalar na tela inicial** e um lembrete de **backup** se não houver backup há 14 dias.
- **Vitest** para testes do motor.
- Ilustrações em **SVG inline**.
- Fonte para letras e números: **Andika** (licença SIL OFL), empacotada no app.

**Estrutura mínima esperada:**
```
src/engine/      motor pedagógico puro (sem React, sem Dexie, sem Date.now())
src/content/     dados: trilhas, etapas, itens, variantes, sugestões
src/activities/  componentes de cada tipo de atividade
src/audio/       serviço de áudio
src/storage/     persistência e derivação de estado
src/parent/      painel dos pais
src/config/pedagogy.ts
```

---

## 4. Modelo de dados

### 4.1 Registro de tentativa (fonte da verdade)
Tudo deriva de um **log imutável de tentativas**, que só recebe registros novos. O estado (domínio, caixas, reforço) é **recalculado a partir do log**. Vantagens: quando eu mudar um limiar, o passado é reavaliado; a simulação vira só "gerar tentativas"; o backup é um único array.

```ts
interface Trial {
  id: string;
  profileId: string;
  sessionId: string;
  trackId: 'colors' | 'letters' | 'numbers';   // extensível
  stageId: string;          // ex.: 'C2'
  itemId: string;           // ex.: 'red', 'M', 'qty-3'
  step: 'match' | 'recognize' | 'recall' | 'trace-guided' | 'trace-dotted' | 'trace-free';
  helpLevel: 0 | 1 | 2;
  optionsCount: number;     // quantas opções havia na tela
  variantId: string;        // qual apresentação do item (ex.: 'red-apple')
  distractorIds: string[];  // o que mais estava na tela
  chosenId: string | null;  // o que a criança tocou (null = inatividade/pulou)
  correct: boolean;
  isReview: boolean;        // veio da fila de revisão
  isPlacement: boolean;     // veio do nivelamento
  mirrored?: boolean;       // só traçado
  timestamp: number;        // epoch ms
}
```

### 4.2 Regras de tempo
- O motor **nunca lê o relógio**. Toda função recebe `now: number`. A interface injeta `Date.now()`; a simulação injeta o relógio falso.
- **Dia de calendário** = dia local do aparelho, com corte às 00:00. A chave de dia é `YYYY-MM-DD` local.
- Cada tentativa é persistida **imediatamente** ao ser respondida. Se o app for fechado no meio, a sessão conta como encerrada e **conta para o limite diário**; as tentativas feitas valem normalmente.

---

## 5. Modelo pedagógico: degraus por trilha

Nas trilhas de Cores e Letras, cada **item** passa por até três degraus, nesta ordem:

| Degrau | Nome | O que a criança faz | O que avalia |
|---|---|---|---|
| 1 | **PAREAR** (`match`) | Toca o que é **igual** ao modelo | Percepção visual |
| 2 | **RECONHECER** (`recognize`) | O narrador diz o nome e a criança toca o certo | Linguagem receptiva |
| 3 | **EVOCAR** (`recall`) | O app mostra o item e pergunta o nome; a criança fala | Linguagem expressiva |

Regras:
- O degrau 2 só é liberado quando o degrau 1 do mesmo item está dominado. O mesmo vale do 2 para o 3.
- **EVOCAR depende de um adulto presente.** Existe um **"modo com adulto"**, ativado no painel ou por um botão discreto antes da sessão. Nesse modo, depois que a criança fala, aparece para o adulto: **"Disse certo" / "Ainda não"**. Sem adulto, EVOCAR não aparece.
- **O avanço entre etapas depende apenas de PAREAR e RECONHECER.** EVOCAR é registrado, aparece no painel e entra na revisão, mas **nunca bloqueia o avanço**.

**Na trilha de Números o modelo é diferente** e está definido etapa a etapa na seção 12.3. Não force os três degraus onde não cabem.

**Variante** = uma apresentação visualmente diferente do mesmo item. A definição de variante por trilha está na seção 12. Mudar só a posição na tela **não** é variante.

---

## 6. Critério de domínio

Uma **habilidade** é o par (item, degrau). Ela é **DOMINADA** quando todas as condições abaixo forem verdadeiras, considerando apenas tentativas com `helpLevel = 0`, `isPlacement = false` e `optionsCount ≥ MIN_OPTIONS`:

1. **Dias qualificados:** um dia é *qualificado* quando a criança fez ≥ `MIN_TRIALS_PER_DAY = 5` tentativas válidas daquela habilidade com **no máximo `MAX_ERRORS_PER_DAY = 1` erro**. Um dia com ≥ 5 tentativas e 2 ou mais erros é um dia *reprovado*. Um dia com menos de 5 tentativas é *neutro* e não conta nem a favor nem contra.
2. A habilidade precisa de **`MASTERY_DAYS = 2` dias qualificados distintos, sem nenhum dia reprovado entre eles**. Um dia reprovado zera a contagem; a criança recomeça a juntar dias qualificados.
3. `MIN_OPTIONS = 4` opções na tela (3 distratores). Tentativas com 2 ou 3 opções são prática e não contam.
4. Somando todas as tentativas corretas que contam, elas cobrem **≥ `MIN_VARIANTS = 3` variantes diferentes** do item (no total, não por dia).

Regras de nível superior:
- Um **item** está dominado quando PAREAR e RECONHECER estão dominados.
- Uma **etapa** está concluída quando todos os seus itens estão dominados.
- A **próxima etapa** é liberada quando a atual está concluída **e** nenhum pré-requisito está em REFORÇO (seção 8).

**Por quê:** "no máximo 1 erro em 5" substitui "≥ 90%", que na prática exigia 5 em 5 e punia o toque acidental. Dois dias distintos separam aprendizado de memória de curto prazo. Quatro opções reduzem o chute. Variação garante que a criança aprende a categoria, não "aquela bolinha do app".

---

## 7. Conjunto ativo e item encalhado

Sem isto, etapas grandes travam a criança: 16 tentativas por sessão espalhadas por 12 itens não chegam a 5 por habilidade em nenhum dia.

- Em cada etapa, o motor mantém um **conjunto ativo** de até `ACTIVE_SET_SIZE = 3` itens. Só eles recebem tentativas de "etapa atual".
- Quando um item do conjunto ativo é dominado, o próximo item da etapa (na ordem do arquivo de conteúdo) entra no lugar dele.
- Itens da etapa que ainda não entraram no conjunto ativo podem aparecer **só como distratores** (seção 11), nunca como alvo.
- **Item encalhado:** se um item está no conjunto ativo há ≥ `STUCK_ACTIVE_DAYS = 5` dias com sessões, sem ser dominado, ele é marcado como `stuck`, **sai do conjunto ativo** (dá lugar ao próximo) e volta quando outro item for dominado. O painel mostra os itens encalhados. A criança não vê nada.
- Um item já dominado **não** recebe mais tentativas de etapa atual, só de revisão. Evita tédio.

---

## 8. Revisão espaçada (consolidação)

Sistema de caixas no estilo **Leitner**:

- Ao ser dominada, cada habilidade entra na **caixa 1**.
- `REVIEW_INTERVALS_DAYS = [1, 3, 7, 14, 30]`. Depois da caixa 5, revisa a cada 30 dias.
- Cada habilidade guarda a **data da próxima revisão**.
- **Só o degrau mais alto dominado de cada item vai para a fila de revisão.** Se RECONHECER está dominado, revisar PAREAR é redundante. Isso corta a carga de revisão pela metade.
- **Uma revisão** = **1 tentativa** sem ajuda, com ≥ 4 opções, variante sorteada entre as já vistas.
  - **Acerto:** sobe uma caixa.
  - **Erro:** a habilidade recebe uma **segunda checagem** na mesma sessão, 3 a 5 tentativas depois, sem ajuda. Acerto na segunda: fica na mesma caixa, próxima revisão no intervalo atual. Erro na segunda: vai para **REFORÇO**.

**Estado REFORÇO:**
- A habilidade volta a ser praticada nas sessões, com prioridade sobre itens novos.
- Sai do reforço com **1 dia qualificado** (≥ 5 tentativas válidas, no máximo 1 erro). Então retorna à caixa 1.
- **Se a habilidade em reforço for pré-requisito da etapa atual** (qualquer item de etapa anterior da mesma trilha, ou pré-requisito declarado), o **desbloqueio da próxima etapa fica congelado** até o reforço terminar.
- **A criança nunca vê "rebaixamento".** Para ela, é só mais uma atividade.

**Por quê:** sem revisão, boa parte do aprendido se perde em dias (curva do esquecimento). Um único erro não deve derrubar uma habilidade consolidada, porque criança de 4 anos erra por distração; a segunda checagem separa distração de esquecimento.

---

## 9. Montagem da sessão

**Escolha da trilha:** a tela inicial mostra as trilhas como **ilhas grandes e ilustradas**. A criança escolhe uma. Trilhas desativadas no painel não aparecem.

**Tamanho:** `SESSION_TARGET_TRIALS = 16` tentativas **ou** `SESSION_MAX_MINUTES = 7`, o que vier primeiro.

**Ordem de prioridade ao preencher as vagas** (o motor preenche nesta ordem, até acabar as vagas):
1. **Aquecimento:** 2 tentativas fáceis. Se houver itens dominados na trilha, usa eles. Se não houver (primeira sessão), usa PAREAR com 2 opções do conjunto ativo, `helpLevel = 1`, que não conta para o domínio.
2. **Fechamento:** reserva a última vaga para 1 item dominado. Se não houver, mesma alternativa do aquecimento.
3. **Segundas checagens** de revisões que falharam nesta sessão (surgem durante a sessão e têm prioridade absoluta na vaga 3 a 5 depois).
4. **Reapresentações com dica** de itens errados (2 a 4 tentativas depois do erro, seção 10).
5. **Habilidades em REFORÇO** da trilha.
6. **Revisões vencidas** da trilha, mais atrasadas primeiro, até `REVIEW_SHARE = 0.30` das vagas.
7. **Revisões muito atrasadas de outras trilhas** (atraso > 2× o intervalo), até 2 por sessão.
8. **Conjunto ativo da etapa atual**, com tentativas distribuídas entre os itens ativos, degrau mais baixo não dominado primeiro.
9. Se sobrarem vagas (sem etapa atual, por exemplo), preenche com revisões não vencidas, mais próximas do vencimento primeiro.

**Intercalação:** itens intercalados, nunca em blocos. **Nunca o mesmo item 3 vezes seguidas.** Se a regra de prioridade produzir isso, troca a ordem.

**Introdução de itens novos:**
- No máximo `NEW_ITEMS_PER_SESSION = 2` itens entrando no conjunto ativo por sessão.
- Cada item novo é **apresentado antes de ser cobrado**: o narrador mostra e nomeia ("Esta é a letra M. Eme!"). A apresentação não é tentativa e não gera registro.

**Etapa concluída mas avanço congelado** (um item de etapa anterior está em reforço): a sessão tem reforço + revisões + itens dominados da etapa atual como "brincadeira livre" (contam como prática, sem efeito). Não há "etapa atual" para preencher.

**Proteção contra frustração:**
- **3 erros seguidos:** reduz a dificuldade (opções mínimas, itens dominados) até 2 acertos seguidos. Tentativas nesse modo não contam para o domínio.
- **Acerto abaixo de 60% depois de 8 tentativas:** encerra mais cedo com 2 itens fáceis e celebração normal.

---

## 10. Tratamento do erro e sistema de dicas

Níveis de ajuda:
- **0: sem ajuda** (conta para o domínio).
- **1: menos opções.** Remove **um distrator** (nunca o alvo), escolhendo o distrator **mais parecido** com o alvo, para que o que fica seja mais fácil.
- **2: resposta indicada.** A opção certa pulsa suavemente.

Quando a criança erra (regra ajustada pela responsável em 2026-10-28, depois de testar com a criança):
1. O narrador diz **só o nome do que ela tocou** ("Essa é a letra ene."), sem apontar a certa e sem sinal visual de erro. **Nunca** "errado" nem "não". A criança continua procurando; cada toque errado nomeia o item tocado. As ajudas por inatividade seguem valendo enquanto ela procura.
2. Ao tocar na certa, o narrador confirma com o nome: "Isso mesmo! Esta é a letra eme!". A tentativa registrada é o **primeiro** toque (erro, se não foi direto); os toques seguintes não são tentativas.
3. O mesmo item volta **2 a 4 tentativas depois**, com ajuda nível 1. Se errar de novo, volta com nível 2. Se acertar com nível 1, a próxima aparição volta ao nível 0.
4. Tentativas com ajuda 1 ou 2 são prática e **não contam para o domínio**.

Quando acerta: feedback curto e positivo, com variações de fala ("Isso!", "Muito bem!", "Achou!"), animação de 1 segundo. Elogiar o esforço com frequência ("Você olhou com atenção!").

---

## 11. Distratores

De onde vêm as outras opções na tela, em ordem de preferência:
1. Outros itens da **mesma etapa** (ativos ou dominados).
2. Itens de **etapas anteriores** da mesma trilha.
3. Itens de **etapas futuras** da mesma trilha, apresentados **sem nome** (a criança só vê; o narrador não os nomeia). Isso resolve C1, que tem só 2 cores mas precisa de 4 opções.
4. Formas neutras (cinza, sem rótulo) como último recurso.

Proibições:
- **Nunca** usar como distrator um item **confundível** com o alvo (listas em 12.2 e 12.3) antes da etapa de contraste correspondente.
- Em RECONHECER de cores, as opções têm **formas variadas** (a forma não pode denunciar a resposta). Em PAREAR de cores, as opções têm a **mesma forma** que o modelo (a cor é o único critério).

---

## 12. Trilhas, etapas e atividades

### 12.1 Trilha das Cores

Proponha os códigos hexadecimais na Fase 0 e justifique, com estas restrições: cores **saturadas e inequívocas**, longe de fronteiras entre categorias; branco com contorno visível; fundo das atividades em cinza-claro neutro (`#F2F2F2` ou similar), nunca colorido.

| Etapa | Itens | Observações |
|---|---|---|
| C1 | vermelho, azul | Contraste máximo |
| C2 | + amarelo, verde | |
| C3 | + preto, branco | |
| C4 | + laranja, roxo, rosa, marrom | |
| C5 | + cinza; **tons variados** das cores dominadas | Generalização da categoria |
| C6 | Classificar por cor objetos de **formas misturadas** | A cor como critério, ignorando a forma |

**Tons da C5:** entregue uma **tabela de tons por cor** (2 claros, 2 escuros) com a regra "este tom ainda é X". Evite tons que invadam outra categoria: vermelho-claro vira rosa, laranja-escuro vira marrom, azul-claro vira ciano. Cada tom aceito é uma **variante** do item.

**Pares de confusão de categoria (para distratores):** azul↔roxo, laranja↔amarelo, rosa↔roxo, cinza↔branco, vermelho↔rosa, laranja↔marrom. Antes de C5, um par desses não aparece junto na tela.

**Pares de visão de cores (só para o alerta):** vermelho↔verde, vermelho↔marrom, verde↔marrom. Esses pares **podem** aparecer juntos desde C1: para a criança típica são cores muito distintas, e é justamente a dificuldade em separá-los que o alerta da seção 15 precisa observar. (Decisão da Fase 1: separar os dois tipos de par; antes, a regra única tornava o alerta impossível de disparar antes de C5.)

**Variantes:** forma geométrica; objeto de cor típica (morango, sol, folha); objeto de cor arbitrária (carrinho, balão, bola). Mínimo 4 variantes por cor no conteúdo.

**Atividades:** PAREAR ("toca no que é igual a este"), RECONHECER ("toca no vermelho"), EVOCAR ("que cor é essa?"). Arrastar para cestos: opcional, só em C6.

### 12.2 Trilha das Letras (maiúsculas de imprensa, Andika)

| Etapa | Itens | Observações |
|---|---|---|
| L1 | Letras do **nome da criança** | Ver regras abaixo |
| L2 | Vogais A, E, I, O, U (dominadas em L1 contam) | |
| L3 | Consoantes de formas distintas: S, T, L, C, V, X, Z, H | Sem pares confundíveis |
| L4a | J, K, Q, Y, W, F | Nenhum par confundível interno |
| L4b | M, P, B, R, D, N, G | Cada letra sem o seu par na mesma sessão: ver regra |
| L5 | **Pares em contraste:** M/N, E/F, P/R, B/D, C/G, I/L, V/W, O/Q | Só libera o par quando as duas letras estão dominadas separadamente |
| L6 | Letra e som inicial: "Qual começa igual a MACACO?" (com figuras) | Ponte para alfabetização |

**Pares confundíveis:** M/N, E/F, P/R, B/D, C/G, I/L, V/W, O/Q, Z/N (rotação), H/N. Antes de L5, duas letras de um mesmo par **nunca** aparecem juntas na tela, nem como distrator.

**Regra da L4b:** a etapa contém letras cujo par está em outra etapa (M está em L4b, N também). Para cumprir a proibição, o conjunto ativo de L4b nunca tem M e N ao mesmo tempo, nem B e D. O motor ordena o conjunto ativo respeitando isso.

**Regras da L1 (nome da criança):**
- Letras únicas, maiúsculas, **sem acento e sem cedilha** (JOÃO → J, O, A; LÍVIA → L, I, V, A). Ç vira C.
- Usa só o **primeiro nome**. Nome composto: só o primeiro.
- Se o nome tiver as duas letras de um par confundível (MANUELA: M e N; DÉBORA: B e D), a L1 fica com a **primeira** delas na ordem do nome e a outra vai para a etapa normal dela.
- Se o nome tiver mais de 6 letras únicas, L1 fica com as 6 primeiras.
- Nome com K, W ou Y: entram normalmente em L1.

**L6:** usa só palavras cuja letra inicial tem **som regular**: nada de C/G (variam), H (mudo), X, S inicial seguido de vogal pode. Banco de 3 a 4 palavras por letra, com figura. Sem fonemas isolados por síntese de voz.

**Variantes de letra:** tamanho (3 tamanhos), cor neutra variada (preto, cinza-escuro, azul-marinho, sem ensinar que a letra "tem" cor) e contexto (sozinha; dentro de uma palavra curta destacada, só a partir de L3). Mínimo 3 variantes por letra.

O narrador usa o **nome da letra em português** ("eme", "erre", "agá").

**Atividades (formas lúdicas dos mesmos degraus; o critério de domínio não muda):**

| Atividade | Degrau | Etapas | Como funciona | Como registra |
|---|---|---|---|---|
| **Toca na letra igual** | PAREAR | L1–L5 | Modelo sozinho no alto, narrador nomeia, opções aparecem (igual às cores) | 1 tentativa |
| **Trem do alfabeto** | RECONHECER | L1–L4b | Trilho com 4 estações (letras). Narrador chama uma letra; a criança toca a estação; o trem anda até ela. Acerto: o trem chega e apita. Erro: a estação certa acende, o trem espera a criança tocar nela | 1 tentativa, 4 opções |
| **Montar palavra copiando o modelo** | PAREAR | L3–L5 | Palavra curta pontilhada em casinhas; as letras já aprendidas aparecem preenchidas e **uma casinha** fica vazia (a letra-alvo da tentativa). Embaixo, 4 letras para escolher. Toque (não arraste): a letra voa para a casinha | 1 tentativa por casinha; só palavras cujas letras já foram apresentadas |
| **Detetive do nome** | PAREAR → prática | L1 | O nome da criança em casinhas. **Com modelo pontilhado:** cada casinha é uma tentativa PAREAR daquela letra, com as letras do nome + distratores embaixo (≥ 4 na tela). **Sem modelo:** só depois que todas as letras do nome estão dominadas em PAREAR; registrado como prática (não conta para o domínio, porque é ortografia, não percepção) | 1 tentativa por letra; atividade composta |
| **Caixa surpresa das iniciais** | RECONHECER (inicial) | L6 | A caixa abre, sai uma figura, o narrador diz a palavra; a criança toca a **letra** inicial entre 4 letras | 1 tentativa |
| **Cadê o meu par** | RECONHECER (inicial) | L6 | Aparece uma letra; a criança toca a **figura** cuja palavra começa com ela, entre 4 figuras | 1 tentativa |
| EVOCAR | EVOCAR | L1–L5 | "Que letra é essa?", modo com adulto | 1 tentativa |

Regras:
- A atividade é escolhida pela **interface** a partir do Slot (item + degrau) que o motor entrega; o motor não muda. Atividades compostas (Detetive, Montar palavra) registram **uma tentativa por letra**, cada uma com suas opções e distratores reais, e todas passam pelas mesmas regras (4 opções, sem ajuda, variantes).
- Letras sempre em **cor neutra** (preto, grafite, azul-marinho). Sem cor por vogal/consoante na v1.
- **Nomes da família:** o painel permite cadastrar outros nomes (até 6). Eles entram no Detetive como palavras extras, só com letras já apresentadas à criança; não criam itens novos nem etapas.
- **Toque, não arraste** (seção 1): a letra tocada "voa" até a casinha.

Traçado de letras: **fora da v1**.

### 12.3 Trilha dos Números

Aqui o modelo item × degrau é definido por etapa:

| Etapa | Item | Degraus e atividade | Variante |
|---|---|---|---|
| N1 | quantidade 1, 2, 3 | **`match` de quantidade:** mostra 1 a 3 objetos por 1,5 s, esconde; a criança escolhe entre 4 cartões de quantidade o igual. Depois **`recognize`:** "toca no que tem três" (sem esconder) | tipo de objeto e arranjo (linha, triângulo, aleatório) |
| N2 | quantidade 1 a 5 | **`recognize` com contagem:** a criança toca cada objeto, ele acende, o narrador conta junto; depois "quantos tem?" com 4 opções de cartões de quantidade. Só este degrau | tipo de objeto e arranjo |
| N3 | símbolo 1 a 5 | **`match`:** "toca no número igual a este". **`recognize`:** "toca no número 3". **`recognize-qty`:** mostra o símbolo, "toca no grupo que tem 3" | tamanho, cor neutra, fonte Andika só |
| N4 | traçado 1 a 5 | `trace-guided` → `trace-dotted` → `trace-free` (ver abaixo) | não se aplica |
| N5 | quantidade, símbolo e traçado 6 a 10 | Mesmas atividades de N2, N3 e N4, nesta ordem interna: símbolo exige quantidade; traçado exige símbolo | idem |
| N6 | pares 6/9, 2/5, 1/7 e o **zero** | `recognize` com os pares juntos pela primeira vez; zero com "quantos tem?" sobre um conjunto vazio | idem |

**Pares confundíveis:** 6/9, 2/5, 1/7, 3/8. Antes de N6 não aparecem juntos.

**Pré-requisitos:** N2 exige N1; N3 exige N2; N4 exige N3; dentro de N5, símbolo exige quantidade e traçado exige símbolo.

**Critério de domínio na trilha de Números:** para `match`, `recognize` e `recognize-qty`, o critério da seção 6 vale integralmente. Para o traçado, ver abaixo.

**Especificação do traçado:**
- O número aparece grande, com **ponto inicial verde** e **animação demonstrativa** antes de cada tentativa.
- A criança traça com o dedo. O app avalia **pontos de verificação em ordem** (início, curvas, fim), com tolerância de `TRACE_TOLERANCE_PX = 40` ao redor do caminho (ajustável). Avalia **direção e sequência**, não perfeição.
- **Espelhamento** (traçado correto refletido horizontalmente) é **aceito como acerto** e registrado com `mirrored = true`. O painel mostra a frequência.
- Um traçado é **acerto** se passa por todos os pontos de verificação na ordem, dentro da tolerância, em uma só tentativa (levantar o dedo encerra o traçado, salvo nos números de dois traços: 4 e 5 aceitam até 2 traços).
- **Degraus:** `trace-guided` (traça por cima de guia completa) → `trace-dotted` (guia pontilhada) → `trace-free` (só o ponto inicial). Os degraus 1 e 2 contam para concluir a etapa. O degrau 3 é registrado e **não bloqueia**.
- **Critério de domínio do traçado:** `optionsCount` não se aplica (grave `optionsCount = 0` e ignore a regra 3 da seção 6). Valem dias qualificados (`TRACE_MIN_TRIALS_PER_DAY = 3`, no máximo 1 erro) em 2 dias, sem variantes.

---

## 13. Áudio e narrador

- **Interface de áudio** com duas implementações:
  1. **Arquivo gravado:** se existir `public/audio/{chave}.mp3` (ou `.m4a`, para gravações futuras no iOS), toca o arquivo.
  2. **Síntese de voz do navegador** em pt-BR como reserva. **Use só vozes com `localService === true`**: as vozes "Google português do Brasil" no Chrome enviam o texto para servidores do Google e violam a privacidade. Se não houver voz local pt-BR, use a melhor voz local disponível e mostre um aviso no painel. Velocidade `SPEECH_RATE = 0.9`.
- Todas as falas ficam num **catálogo de falas** (chave → texto) em `src/content/speech.ts`.
- Botão grande de **"ouvir de novo"** em toda tela da criança.
- Nunca dependa de áudio tocando sozinho no primeiro carregamento. Use um toque inicial ("toca para começar") para liberar o áudio.
- Pré-carregue a voz: uma fala vazia no toque inicial, para a primeira instrução não demorar.

---

## 14. Nivelamento inicial

Na primeira vez em cada trilha, um **jogo de nivelamento** de 2 a 3 minutos que não pareça teste:
- Testa itens representativos de cada etapa, em ordem, com `isPlacement = true`, 4 opções, sem ajuda.
  - Cores e Letras: degrau RECONHECER, 2 itens por etapa, 2 tentativas por item.
  - Números: N1 `match`, N2 `recognize`, N3 `recognize`. Não testa traçado nem N6.
- Etapa com ≥ 80% de acerto: todos os itens da etapa ficam **"provisoriamente dominados"**: PAREAR e RECONHECER entram na **caixa 1** com próxima revisão amanhã. O domínio é **confirmado pelas revisões**, não presumido. Se falhar na revisão, segue a regra normal (segunda checagem, reforço).
- Para na primeira etapa abaixo de 80%. A criança começa ali, com o conjunto ativo vazio e preenchido pelos primeiros itens.
- O responsável pode refazer o nivelamento pelo painel (apaga o provisório, mantém o log).

---

## 15. Painel dos pais

Acesso por gesto que uma criança de 4 anos dificilmente faz sozinha: segurar um botão por 3 segundos e depois responder uma conta simples (ex.: 7 + 5).

**Perfis:** vários perfis no mesmo aparelho, cada um com progresso próprio. Cadastro: nome (usado em L1), apelido falado pelo narrador, avatar original.

**Progresso:**
- Mapa por trilha e item, com o estado de cada habilidade: não iniciada, em prática (com dias qualificados até agora), dominada (caixa e data da próxima revisão), provisória, em reforço, encalhada.
- Histórico: sessões por dia, tempo, taxa de acerto por trilha.
- Registro de espelhamento nos traçados.

**Atividades fora da tela:** para **cada etapa de cada trilha**, 3 a 5 sugestões curtas em `src/content/offscreen.ts` ("caça às cores no banho", "fazer a letra do nome com massinha", "traçar o número na areia ou nas costas da criança", "contar degraus da escada"). A sugestão da semana aparece em destaque com um botão **"Fizemos!"** que só registra. **Isso nunca interfere no avanço.**

**Alerta de padrão (triagem, não diagnóstico), v1:**
- **Possível dificuldade na visão de cores:** na trilha de cores, em PAREAR e RECONHECER sem ajuda, distribuídas em ≥ 2 dias, com **≥ `CVD_MIN_ERRORS = 6` erros no total**, ≥ 40% dos erros têm `chosenId` em um par típico (vermelho↔verde, vermelho↔marrom, verde↔marrom). Linguagem: "Notamos um padrão que pode valer uma conversa com um oftalmologista, incluindo um teste de visão de cores. Isso não é um diagnóstico." Aparece só no painel.
- Observação honesta no texto do painel: cores saturadas se distinguem por brilho, então o app **não** substitui o exame.

**Configurações:** limite diário de sessões (padrão **2**, de 1 a 4); modo com adulto; ativar/desativar trilhas; volume e velocidade do narrador.

**Dados:** exportar e importar backup em JSON (o log de tentativas + perfis); apagar perfil com confirmação; lembrete de backup a cada 14 dias; aviso para instalar na tela inicial no iOS.

**Ao atingir o limite diário:** tela amigável ("Hora de brincar lá fora!") com ilustração e ícone da sugestão fora da tela do dia.

---

## 16. Modo de simulação e perfis simulados

**Modo de desenvolvedor**, acessível pelo painel:
- **Avançar o relógio** (dias) para testar a revisão espaçada. O relógio falso é injetado como `now` em todo o motor.
- **Responder automaticamente** uma sessão inteira com taxa de acerto configurada.
- Ver o **estado interno** de cada habilidade: tentativas, dias qualificados, variantes vistas, caixa, próxima revisão, encalhada.
- Resetar um perfil.

**Perfis simulados para os testes do motor.** Cada perfil é uma função `probabilityCorrect(skill, state, now)`, com um modelo simples: a chance de acerto **sobe com o número de exposições** e **cai com os dias sem ver o item**. Parâmetros por perfil:

| Perfil | Aprende | Esquece | Particularidade |
|---|---|---|---|
| rápido | +0,25 por exposição, teto 0,98 | 2%/dia | |
| devagar | +0,06 por exposição, teto 0,95 | 4%/dia | |
| esquecida | +0,20 por exposição | 12%/dia | deve entrar em reforço |
| confunde vermelho/verde | como "rápido" | como "rápido" | quando o alvo é vermelho ou verde e o outro está na tela, 50% de chance de tocar no par |

Para cada perfil, os testes verificam o comportamento esperado: avanço, bloqueio, entrada e saída do reforço, alerta disparado (ou não disparado para os outros perfis), e geram um **relatório de trajetória** (texto) mostrando dia a dia o que foi dominado.

---

## 17. Cenários de aceite do motor (obrigatórios)

Escreva cada um como teste, com estes nomes. Todos devem passar antes do fim da Fase 1.

1. **Opções insuficientes não contam:** 100% de acerto em C1 com 3 opções durante 5 dias → nada dominado.
2. **Um dia só não basta:** 10 acertos em 10, 4 opções, 3 variantes, num só dia → não dominado. Mais 5 acertos no dia seguinte → dominado.
3. **Dia reprovado zera:** dia 1 qualificado, dia 2 com 5 tentativas e 2 erros, dia 3 qualificado → **não** dominado. Dia 4 qualificado → dominado.
4. **Dica não conta:** 20 acertos com `helpLevel = 1` em 3 dias → não dominado.
5. **Variantes:** 2 dias qualificados mas só 2 variantes → não dominado; ao acertar uma terceira variante → dominado.
6. **Etapa só libera completa:** C1 com vermelho dominado e azul em prática → C2 bloqueada.
7. **Revisão: um erro não derruba:** habilidade na caixa 3 erra a revisão e acerta a segunda checagem → continua na caixa 3.
8. **Revisão: dois erros derrubam:** erra as duas → REFORÇO; aparece com prioridade na próxima sessão; 1 dia qualificado → caixa 1.
9. **Reforço congela:** criança em C3 com todos os itens de C3 dominados, mas "azul" (C1) em reforço → C4 não libera. Azul sai do reforço → C4 libera.
10. **Conjunto ativo:** etapa com 7 itens → no máximo 3 recebem tentativas de alvo até um ser dominado.
11. **Nunca 3 seguidas:** em 1000 sessões montadas aleatoriamente, nenhuma tem o mesmo item 3 vezes seguidas.
12. **Par confundível isolado:** em 1000 sessões antes de L5, M e N nunca aparecem na mesma tela.
13. **Alerta de cores dispara só para o perfil certo:** o perfil "confunde vermelho/verde" dispara o alerta em até 10 sessões; os outros três nunca disparam em 30 sessões.
14. **Fora da tela não interfere:** registrar 50 "Fizemos!" não muda nenhum estado de habilidade.
15. **Relógio injetado:** o motor não contém nenhuma chamada a `Date.now()` ou `new Date()` sem argumento (teste por busca no código-fonte do `src/engine/`).

---

## 18. Fases de entrega

Ao fim de cada fase: testes passando, app rodando, instruções de teste para mim, pausa para revisão.

| Fase | Entrega | Critério de aceite |
|---|---|---|
| **0** | Plano, arquitetura, estrutura de pastas, hexadecimais das cores, tabela de tons da C5, perguntas (máx. 5) | Minha aprovação |
| **1** | Motor completo (domínio, conjunto ativo, Leitner, reforço, montagem de sessão, distratores, nivelamento, alerta de cores) + os 15 cenários + os 4 perfis simulados. Sem interface | Tudo passando; relatório de trajetória de cada perfil |
| **2** | Estrutura do app, perfis, narrador, tela inicial com ilhas, **Trilha das Cores completa**, painel básico, modo de simulação | Consigo completar C1 e C2 na simulação e ver a revisão funcionar avançando o relógio |
| **3** | **Trilha dos Números**, incluindo o traçado | O traçado aceita variações razoáveis e espelhamento; os degraus funcionam |
| **4a** | **Trilha das Letras**, L1–L5: toca na letra igual, trem do alfabeto, montar palavra copiando o modelo, detetive do nome, nomes da família no painel | L1 usa o nome cadastrado com as regras da 12.2; L5 só libera pares já dominados; cada atividade registra tentativas que passam pelo critério de domínio |
| **4b** | **L6** (letra e som inicial): caixa surpresa e cadê o meu par, com as 48 figuras do banco de palavras | Figuras legíveis em tela de celular; palavras com som inicial regular |
| **5** | Sugestões fora da tela, limite diário, backup/importação, lembretes iOS, alerta de cores no painel, PWA offline | App instalável funcionando sem internet |
| **6** | Publicação: passo a passo para GitHub Pages e para **instalar no celular e no tablet** | Consigo abrir o link, instalar e usar offline |

---

## 19. Checklist final de qualidade

Antes de considerar a v1 concluída, verifique e me relate:
- [ ] A criança usa todas as telas **sem ler nada**.
- [ ] Nenhuma tela mostra erro de forma punitiva.
- [ ] O avanço de etapa **nunca acontece** sem o critério completo (cenários 1 a 6).
- [ ] Itens dominados **voltam para revisão** nas datas previstas (prova pela simulação).
- [ ] Erro duplo na revisão leva ao **reforço** e congela o desbloqueio quando é pré-requisito (cenários 8 e 9).
- [ ] Atividades fora da tela **nunca** interferem no avanço (cenário 14).
- [ ] O app funciona **offline**, em celular e tablet, nas duas orientações.
- [ ] Nenhum dado sai do aparelho, **inclusive pela síntese de voz** (só vozes locais).
- [ ] Nenhuma imagem, personagem ou som de terceiros protegido; atribuições de OpenMoji/Twemoji na tela "Sobre", se usados.
- [ ] Todos os parâmetros pedagógicos estão em `src/config/pedagogy.ts`, comentados.
- [ ] O motor não lê o relógio (cenário 15).
- [ ] Nenhuma requisição de rede após o primeiro carregamento, exceto a verificação de atualização do próprio app (seção 20).
- [ ] O app não solicita nenhuma permissão do sistema (câmera, microfone, localização, notificações).

---

## 20. Segurança (requisitos)

Análise completa em `docs/SEGURANCA.md`. Requisitos:

1. **CSP restritiva** na `index.html`: `default-src 'self'; connect-src 'self'; img-src 'self' data:; media-src 'self' blob:; font-src 'self'; style-src 'self' 'unsafe-inline'`. Nenhum domínio externo.
2. **Nenhum recurso externo em tempo de execução:** fontes, ícones, scripts e SVGs empacotados. Teste automatizado procura `http://` e `https://` no bundle final e só aceita as URLs de atribuição da tela Sobre (como texto).
3. **Voz só local** (`localService === true`), já definido na seção 13.
4. **Cadastro mínimo:** primeiro nome e apelido, até 30 caracteres cada, só letras, espaço, hífen e acentos. Sem data de nascimento, sobrenome ou foto.
5. **Backup:** JSON legível. Antes de exportar, aviso: "Este arquivo contém o nome da criança e o histórico de atividades. Guarde-o em local privado." Na importação, validação de estrutura e tipos, limite de 20 MB, recusa com mensagem clara se inválido. Nunca executar nada do arquivo.
6. **Sem `dangerouslySetInnerHTML`.** SVGs são componentes.
7. **Dependências de produção:** apenas `react`, `react-dom`, `dexie`. `package-lock.json` versionado; `npm ci` na publicação; `npm audit` com falha em vulnerabilidade alta ou crítica bloqueia a publicação.
8. **Nenhuma permissão do sistema** solicitada na v1.
9. **Links externos** só na tela Sobre, dentro do painel protegido. Nenhum link em tela da criança.
10. **Repositório público sem dado pessoal.** O nome da criança nunca aparece no código, em testes ou em arquivos de conteúdo; usar nomes fictícios nos testes.

Comece pela **Fase 0**.
