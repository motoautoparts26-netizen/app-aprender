# Fase 0: decisões aprovadas

Aprovado em 2026-10-27.

| Pergunta | Resposta | Consequência no projeto |
|---|---|---|
| Aparelho | Celular **Android** (tablet depois) | Chrome Android: IndexedDB persiste, voz pt-BR local costuma existir (Google TTS instalado no aparelho conta como `localService`). Tratamento iOS fica implementado mas não é prioridade de teste |
| GitHub | Conta existente (anagrazi88@gmail.com) | Publicação em GitHub Pages: `https://<usuario>.github.io/app-aprender/`. Confirmar o nome de usuário na Fase 6 |
| Nome | (cadastrado no painel; não fica no código) | L1 = as letras do nome. Nenhum par confundível dentro do nome. Narrador usa o apelido cadastrado |
| Voz | A meu critério | Só vozes `localService === true`. Se não houver pt-BR local: usa a melhor local disponível e o painel mostra aviso com instrução para instalar "Google Speech Services / Voz pt-BR" nas configurações do Android, que é local |
| Ilustrações | A meu critério | SVG próprio para formas, cestos, ilhas, letras, números e cartões de quantidade. **OpenMoji** (CC BY-SA 4.0) para objetos do cotidiano e animais, copiado para `src/content/svg/` (não carregado da internet), com atribuição na tela Sobre |

Observação adicional do responsável: **segurança de dados e segurança geral** são requisito. Análise em `docs/SEGURANCA.md`; as medidas entraram na especificação como seção 20.
