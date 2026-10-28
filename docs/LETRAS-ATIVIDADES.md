# Atividades da Trilha das Letras: viabilidade e impacto no plano

Pedido em 2026-10-28, a partir do material "Little Seeds" (3 a 6 anos, alfabeto móvel). Decisão: **v1 recebe as cinco atividades como formas lúdicas das etapas que já existem**, sem mudar o critério de domínio; a **Trilha das Palavras fica registrada para a v2**.

## Viabilidade, atividade por atividade (v1)

| # | Atividade | Viável? | Como encaixa no motor | Observações |
|---|---|---|---|---|
| 1 | **Trem do alfabeto** | Sim, integral | É o degrau RECONHECER com outra "roupa": 4 estações = 4 opções; o toque na estação é a resposta; o trem andando é o feedback | Custo baixo. Mesmo alvo de toque (≥ 64 px). Erro: a estação certa acende e o trem espera |
| 2 | **Detetive do nome** | Sim, com duas adaptações | **Com modelo pontilhado:** cada casinha é uma tentativa PAREAR da letra, com ≥ 4 letras na tela (as do nome + distratores). **Sem modelo:** só quando todas as letras do nome estão dominadas em PAREAR; registrado como **prática**, não conta para o domínio | Adaptação 1: **toque em vez de arraste** (seção 1: arrastar aos 4 anos gera erro motor que contamina o registro). Adaptação 2: a versão sem modelo é ortografia (memória da sequência), não percepção; por isso não pode valer como PAREAR. Nomes da família: campo no painel, até 6 |
| 3 | **Caixa surpresa das iniciais** | Sim, integral | É o RECONHECER da L6 com **letras** como opções: figura + palavra falada → toca a letra inicial | Depende das **48 figuras** do banco de palavras (12 letras × 4). É a parte mais trabalhosa; por isso virou Fase 4b |
| 4 | **Cadê o meu par** | Sim, integral | É o RECONHECER da L6 com **figuras** como opções (o desenho original da L6) | Mesma dependência das figuras. Distratores: figuras de outras iniciais, nunca duas da mesma letra |
| 5 | **Montar palavra copiando o modelo** | Sim, com uma adaptação | Palavra pontilhada; **uma casinha vazia por vez** é a tentativa PAREAR da letra-alvo que o motor pediu; as outras letras aparecem preenchidas. Toque, não arraste | Adaptação: o motor entrega uma letra por vez; a palavra é escolhida para **conter** essa letra e só ter letras já apresentadas. Assim a tentativa conta normalmente. Palavras do banco da L6 |

O que fica igual para todas: 4 opções, sem ajuda para contar, 3 variantes, 2 dias qualificados, letras em cor neutra, nenhuma punição, inatividade → repete → ajuda.

## Como a interface escolhe a atividade

O motor continua entregando `Slot { item, degrau }`. A interface decide a "roupa":
- `recognize` em L1–L4b → **Trem** (alternando com "toca na letra" para variar).
- `match` em L1 → **Detetive do nome** quando a sessão tem ≥ 2 letras do nome no conjunto ativo; senão "toca na letra igual".
- `match` em L3–L5 → **Montar palavra** quando existe palavra do banco só com letras apresentadas; senão "toca na letra igual".
- `recognize` em L6 → **Caixa surpresa** e **Cadê o par**, alternando.

Atividades compostas (Detetive) registram uma tentativa por letra, todas com `optionsCount` real. O motor as trata como tentativas comuns. Nenhuma regra do motor muda; nenhum teste da Fase 1 precisa mudar.

## O que não entra, e por quê

| Do material de inspiração | Por que não |
|---|---|
| Bomba do alfabeto (música + tirar letra do saco) | Tem **cronômetro/pressão** (seção 1 proíbe) e a avaliação é falada (depende de adulto; já coberto pelo EVOCAR) |
| Cofre secreto com pistas ("tem 4 letras, começa com C…") | Exige compreensão de pistas verbais e leitura; é de 6 anos, fora do público da v1 |
| Desafio de 1 minuto | Cronômetro, vedado |
| Diretor de histórias | Criação livre que o app não consegue avaliar; vale como sugestão fora da tela |
| Caça ao tesouro pela sala | Fora da tela por natureza; entra nas **sugestões** da L3–L5 |

## Trilha das Palavras (v2, registrada na especificação, seção 2)

Liberada quando **Letras e Sons** estiverem dominadas. Etapas, na ordem: palavra quebrada (B _ L A) → montar sem modelo a partir da figura → caça ao tesouro das letras numa cena → pizzaria (pedido falado) → palavra maluca (BAOL → BOLA) → laboratório (PATO → GATO). Vogais e consoantes podem ter cores diferentes nessa trilha, como no alfabeto móvel.

Por que não na v1: são tarefas de **leitura e ortografia** (5 e 6 anos no próprio material). Antes disso a criança precisa reconhecer todas as letras e ter consciência de sons (Trilha dos Sons, v2). Colocar agora inverteria a ordem pedagógica.

## Impacto no cronograma

| Fase | Antes | Agora |
|---|---|---|
| 3 Números com traçado | 2 sessões | **2 sessões** (inalterada; é a próxima) |
| 4 Letras | 1 a 2 sessões | **4a** L1–L5 com trem, montar palavra, detetive e nomes da família: 2 a 3 sessões · **4b** L6 com caixa surpresa, cadê o par e 48 figuras: 1 a 2 sessões |
| 5 e 6 | inalteradas | inalteradas |

**Total: cerca de 2 sessões a mais** na v1, todas na Fase 4. Nenhuma fase anterior muda, o motor não muda, e nada já construído precisa ser refeito. Se a prioridade for ter Letras na mão da criança mais cedo, dá para entregar a 4a (L1 a L5, que é onde ele vai ficar nas primeiras semanas) e deixar a 4b para depois da Fase 5.
