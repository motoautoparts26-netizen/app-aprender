# Fase 4b: Letras L6 (letra e som inicial). Entrega e como testar

Entregue em 2026-10-28.

## O que foi construído

| Parte | Arquivos | O que faz |
|---|---|---|
| 48 figuras originais | `src/content/svg/WordPicture.tsx` | Uma figura SVG por palavra do banco da L6 (12 letras × 4), estilo único, legível em 64 px |
| Banco da L6 | `src/content/letters.ts` (`L6_WORDS`) | Só letras com som inicial regular (B, D, F, J, L, M, N, P, R, T, V, Z); palavras concretas de 4 anos |
| **Caixa surpresa das iniciais** | `src/activities/letters/InitialSound.tsx` | A caixa abre, sai a figura, o narrador diz a palavra; a criança toca a **letra** inicial entre 4 letras |
| **Cadê o meu par** | idem | Aparece a letra; a criança toca a **figura** cuja palavra começa com ela, entre 4 figuras |
| Prévia de atividades | `src/parent/ActivityPreview.tsx` | Na aba Simulação: abre qualquer atividade (item + degrau) sem gravar nada; galeria das 48 figuras com a palavra falada ao tocar |

Motor inalterado. Teste novo: toda palavra da L6 tem figura e começa com a letra certa. Testes: 41/41.

## Como testar (você)

A L6 só libera depois de L5, então o caminho prático é a **prévia**:

1. Painel (segure o canto 3 s + soma) → Configurações → "Mostrar a aba Simulação" → aba **Simulação**.
2. Em **Prévia de atividades**, escolha um item `L6 · bê (init-B)` e o degrau `recognize`. **Abrir prévia** várias vezes: ora vem a **caixa surpresa** (figura sai da caixa, "Da caixa saiu... banana! Qual letra começa banana? Toca nela." e 4 letras), ora o **cadê o meu par** (letra B em cima, "Qual figura começa com bê?" e 4 figuras).
3. **Galeria das 48 figuras**: veja todas; toque numa para ouvir a palavra. Se alguma não ficar clara para a criança, me diga o nome e eu redesenho ou troco a palavra.
4. A prévia também serve para as outras atividades: cores (qualquer etapa), trem (`recognize` em L1–L4b), montar palavra (`match` em L3+), detetive (`match` em L1).

## Verificado por mim
- Galeria: 48 figuras renderizando; redesenhei a foca e troquei "nariz" por "neve" por legibilidade.
- Caixa surpresa com tampa virando para trás e banana saindo; 4 letras embaixo com o alvo certo.
- Cadê o meu par: letra B no alto e figuras pato, barco*, vela, neve (uma por letra, nunca duas da mesma inicial).

## Decisões
- As figuras são **originais e simples**. Se quiser as do OpenMoji para animais e objetos, é uma troca de arquivo na Fase 5, com atribuição na tela Sobre.
- Na L6 pares visualmente parecidos (B/D) **podem** aparecer juntos como letras-opção: o foco é o som inicial, não a forma; a L5 já trabalhou a forma.
- Distratores do "cadê o meu par" são sempre figuras de **outras iniciais** (nunca duas palavras com a mesma letra).

## O que falta na v1
Fase 3 (Números com traçado), Fase 5 (sugestões fora da tela, limite diário já existe, backup, alerta no painel já existe, ícones PWA, avisos iOS) e Fase 6 (publicação e instalação).
