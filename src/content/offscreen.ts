/**
 * Sugestões de atividades fora da tela, por etapa (seção 15). Curtas, com material de casa.
 * "Fizemos!" só registra; nunca interfere no avanço.
 */
export interface Suggestion {
  title: string;
  text: string;
  /** Forma do app usada como ícone (ColorShape) e cor. */
  icon: { shape: string; fill: string };
}

const S = (title: string, text: string, shape = 'star', fill = '#FFD400'): Suggestion => ({ title, text, icon: { shape, fill } });

export const OFFSCREEN: Record<string, Suggestion[]> = {
  C1: [
    S('Caça ao vermelho e ao azul', 'Pela casa, achem três coisas vermelhas e três azuis. Diga o nome da cor a cada achado.', 'apple', '#E02020'),
    S('Roupas por cor', 'Ao guardar a roupa, peça para separar o que é vermelho do que é azul.', 'square', '#1F5FD6'),
    S('Dois potes', 'Dois potes, um com papel vermelho e um com azul: a criança distribui brinquedos pela cor.', 'circle', '#E02020'),
    S('No banho', 'Com brinquedos de banho, "me dá o azul", "me dá o vermelho".', 'raindrop', '#1F5FD6'),
  ],
  C2: [
    S('Caça às quatro cores', 'Vermelho, azul, amarelo e verde: uma coisa de cada pela casa.', 'sun', '#FFD400'),
    S('Frutas na mesa', 'Na hora de comer: banana amarela, maçã vermelha, folha verde. Nomeie a cor.', 'banana', '#FFD400'),
    S('Semáforo', 'Na rua, aponte o semáforo: vermelho, amarelo, verde. "Que cor acendeu?"', 'circle', '#1FA83C'),
    S('Massinha', 'Com massinha de quatro cores, "faz uma bolinha amarela".', 'circle', '#FFD400'),
  ],
  C3: [
    S('Preto e branco em casa', 'Procurem coisas pretas e brancas: sapato, papel, teclado, nuvem.', 'cloud', '#FFFFFF'),
    S('Desenho de contraste', 'Giz branco em papel preto, ou caneta preta em papel branco.', 'square', '#1A1A1A'),
    S('Bichos', 'Zebra, pinguim, vaca: onde é preto e onde é branco?', 'cat', '#1A1A1A'),
  ],
  C4: [
    S('Caça de oito cores', 'Agora com laranja, roxo, rosa e marrom também: uma de cada.', 'orange-fruit', '#FF8A1F'),
    S('Lanche colorido', 'Laranja (fruta), uva roxa, chocolate marrom: nomeie as cores ao comer.', 'grapes', '#7A3FBF'),
    S('Arco-íris de lápis', 'Organize os lápis de cor por cor, nomeando cada um.', 'flower', '#FF6FAE'),
    S('Terra e troncos', 'No parque: marrom da terra e do tronco, rosa das flores.', 'tree-trunk', '#8B5A2B'),
  ],
  C5: [
    S('Claro e escuro', 'Duas roupas azuis diferentes: "as duas são azul, uma clara e uma escura".', 'square', '#8FB0F0'),
    S('Céu do dia', 'Olhe o céu de manhã e ao entardecer: "ainda é azul?"', 'raindrop', '#5B8BE6'),
    S('Cinza na cidade', 'Calçada, poste, nuvem de chuva: achem o cinza.', 'rock', '#8E8E8E'),
  ],
  C6: [
    S('Separar por cor, não por forma', 'Misture peças de formas diferentes e peça para separar só pela cor.', 'hexagon', '#1FA83C'),
    S('Guardar brinquedos', 'Caixa do vermelho, caixa do azul… cada brinquedo vai pela cor.', 'square', '#E02020'),
    S('Varal de cores', 'Pregadores coloridos: pendure cada um na roupa da mesma cor.', 'heart', '#FF6FAE'),
  ],
  L1: [
    S('Nome com massinha', 'Faça as letras do nome com massinha, uma por vez, dizendo o nome da letra.', 'star', '#FF8A1F'),
    S('Letra na porta', 'Escreva a primeira letra do nome num papel e cole na porta do quarto.', 'square', '#6FA8DC'),
    S('Caça à letra do nome', 'Em embalagens e livros, procurem a primeira letra do nome.', 'star', '#7A3FBF'),
    S('Letras do nome na areia', 'Na areia ou na farinha, trace as letras do nome com o dedo.', 'circle', '#F2E2B0'),
  ],
  L2: [
    S('Vogais cantadas', 'Cante A-E-I-O-U batendo palmas em cada vogal.', 'star', '#FFD400'),
    S('Caça às vogais', 'Numa revista, circule os A que encontrar; depois os E.', 'circle', '#1F5FD6'),
    S('Boca da vogal', 'No espelho, façam a boca de cada vogal e digam o som.', 'heart', '#FF6FAE'),
  ],
  L3: [
    S('Letras com o corpo', 'Façam um T, um L e um X com os braços.', 'star', '#1FA83C'),
    S('Letras na rua', 'Placas e lojas: "achou um S?"', 'square', '#6FA8DC'),
    S('Letras de macarrão', 'Sopa de letrinhas ou macarrão: separem as letras que já conhece.', 'circle', '#FFD400'),
  ],
  L4a: [
    S('Caixa de letras', 'Letras de brinquedo numa caixa: tire uma, diga o nome.', 'square', '#FF8A1F'),
    S('Qual é a letra?', 'Escreva uma letra grande no papel e cubra devagar: "já sabe qual é?"', 'star', '#7A3FBF'),
    S('Letras na lista de compras', 'No mercado, mostre letras nos rótulos que ele já conhece.', 'circle', '#1F5FD6'),
  ],
  L4b: [
    S('Letras com massinha', 'M, P, B, R: faça com massinha e diga o nome de cada uma.', 'star', '#E02020'),
    S('Trem de letras no chão', 'Cinco letras no chão: a criança "dirige" o trem até a letra que você chamar.', 'car', '#1F5FD6'),
    S('Caça às letras', 'Esconda letras pela sala e peça para achar a que você disser.', 'square', '#1FA83C'),
  ],
  L5: [
    S('Pares lado a lado', 'Escreva M e N juntos, bem grandes: conte as "perninhas" de cada um.', 'square', '#6FA8DC'),
    S('B e D com as mãos', 'Mãos fechadas com polegar para cima: a esquerda faz b, a direita faz d.', 'heart', '#FF6FAE'),
    S('Espelho das letras', 'Mostre um P e um R: qual tem a "perna" a mais?', 'star', '#FFD400'),
  ],
  L6: [
    S('Caixa surpresa de casa', 'Objetos pequenos numa caixa: tire um e diga a letra inicial.', 'square', '#C89B5E'),
    S('Cadê o meu par?', 'Mostre uma letra e peça um objeto da casa que comece com ela: B de bola.', 'star', '#1F5FD6'),
    S('Nome dos amigos', '"Com que letra começa o nome da vovó? E do cachorro?"', 'heart', '#FF6FAE'),
  ],
  N1: [
    S('Quantos dedos?', 'Mostre 1, 2 ou 3 dedos rapidinho e esconda: "quantos eram?"', 'star', '#FFD400'),
    S('Dados', 'Jogue um dado e diga a quantidade sem contar, só de olhar.', 'square', '#FFFFFF'),
    S('Frutas no prato', 'Coloque 2 ou 3 uvas: "quantas tem?"', 'grapes', '#7A3FBF'),
  ],
  N2: [
    S('Contar degraus', 'Suba a escada contando cada degrau em voz alta.', 'square', '#8B5A2B'),
    S('Tocar e contar', 'Conte os brinquedos tocando em cada um, um por vez.', 'circle', '#1F5FD6'),
    S('Palmas', 'Bata palmas contando até cinco; depois ela bate e você conta.', 'heart', '#FF6FAE'),
    S('Pôr a mesa', 'Quantos garfos para a família? Conte e pegue.', 'star', '#FF8A1F'),
  ],
  N3: [
    S('Números na rua', 'Procurem o 3 em placas, ônibus e portas.', 'square', '#1F5FD6'),
    S('Número e quantidade', 'Escreva um número no papel e peça a mesma quantidade de feijões.', 'circle', '#8B5A2B'),
    S('Controle remoto', 'No controle da TV: "aperta o 2".', 'square', '#1A1A1A'),
  ],
  N4: [
    S('Número nas costas', 'Trace um número nas costas da criança com o dedo: "qual é?"', 'star', '#FF6FAE'),
    S('Número na areia', 'Na areia, na farinha ou no vapor do espelho, trace de 1 a 5.', 'circle', '#F2E2B0'),
    S('Massinha de números', 'Faça o 2 e o 3 com rolinhos de massinha.', 'star', '#1FA83C'),
  ],
  N5: [
    S('Contar até 10 subindo', 'Dez pulos, dez passos, dez palmas: conte junto.', 'star', '#FFD400'),
    S('Dez dedos', 'Mostre os dedos das duas mãos e conte até 10, dobrando um por vez.', 'heart', '#FF8A1F'),
    S('Números grandes na rua', 'Procurem o 7, o 8 e o 9 em placas e preços.', 'square', '#1F5FD6'),
  ],
  N6: [
    S('Nenhum', 'Prato vazio: "quantas uvas tem? Nenhuma: zero!"', 'circle', '#8E8E8E'),
    S('6 ou 9?', 'Escreva um 6 e vire o papel: virou 9! Mostre a diferença pela "barriguinha".', 'star', '#7A3FBF'),
    S('2 e 5 no espelho', 'Escreva 2 e 5 grandes: um "olha" para um lado, o outro para o outro.', 'square', '#E02020'),
  ],
};

/** Sugestão da semana para uma etapa: gira pelo número da semana, para variar. */
export function weeklySuggestion(stageId: string, now: number): { index: number; suggestion: Suggestion } | null {
  const list = OFFSCREEN[stageId];
  if (!list || list.length === 0) return null;
  const week = Math.floor(now / (7 * 86_400_000));
  const index = week % list.length;
  return { index, suggestion: list[index]! };
}
