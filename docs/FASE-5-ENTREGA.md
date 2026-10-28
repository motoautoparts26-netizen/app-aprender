# Fase 5: sugestões fora da tela, backup, avisos, ícones e build de produção

Entregue em 2026-10-28.

## O que foi construído

| Parte | Arquivos | O que faz |
|---|---|---|
| Sugestões fora da tela | `src/content/offscreen.ts` | 3 a 5 sugestões por etapa, **18 etapas** (C1–C6, L1–L6, N1–N6), com material de casa |
| Aba **Fora da tela** | `src/parent/SuggestionsTab.tsx` | Sugestão da semana por trilha (gira pela semana), botão **Fizemos!** (só registra), lista das outras ideias |
| Tela do limite diário | `src/child/LimitScreen.tsx` | Mostra a sugestão da semana com ícone, para o adulto ver na hora |
| **Backup** | `src/storage/backup.ts`, `src/parent/DataTab.tsx` | Exportar JSON legível (perfis, tentativas, "Fizemos!", configurações); importar com validação de estrutura e tipos, limite 20 MB, confirmação; nada do arquivo é executado |
| Lembretes | `DataTab.tsx` | Backup há ≥ 14 dias (ou nunca) com progresso existente; iPhone/iPad sem instalação na tela inicial |
| Ícones do app | `scripts/icons.ts`, `public/icons/icon-192.png`, `icon-512.png` | Gerados sem bibliotecas (PNG escrito à mão); 512 é "maskable" com margem |
| Build de produção | `npm run build` | `dist/` com CSP restritiva no HTML, service worker com precache de tudo (inclui áudios e fontes), manifesto PWA |
| Figuras | `WordPicture.tsx` | Lua e banana redesenhadas (não se confundem mais) |

Testes: 50/50 (4 novos: backup válido, inválido, grande demais, campos extras ignorados).

## Como testar (você)

### Fora da tela
Painel → **Fora da tela**: uma sugestão em destaque por trilha, para a etapa atual. Toque em **Fizemos!**: o contador sobe; o progresso da criança não muda (prova: aba Progresso igual antes e depois). "Outras ideias" lista todas da etapa.

### Backup
Painel → **Dados** → **Exportar backup (JSON)**: baixa `aprender-backup-AAAA-MM-DD.json`. Abra o arquivo num editor: é legível, só dados. Para testar a importação: em outro navegador (ou depois de "Apagar progresso" na simulação), **Importar backup** → escolha o arquivo → confirme → o progresso volta. Tente importar um arquivo qualquer (.txt renomeado): recusa com mensagem clara.

### Limite diário
Depois de 2 sessões no dia, a tela "Hora de brincar lá fora!" mostra a sugestão da semana embaixo.

### Build de produção (o que vai para o celular na Fase 6)
```bash
npm run build
```
```bash
npm run preview
```
Abra `http://localhost:4173/app-aprender/`. É a versão final: sem modo de desenvolvimento, com a CSP ativa. Tudo deve funcionar igual ao `npm run dev`.

## Verificado por mim
- Build: 411 arquivos, 7,6 MB (dos quais ~7 MB são os áudios gerados até agora); CSP presente no `index.html`; `sw.js` e manifesto gerados; 398 mp3 no precache.
- Build aberta no navegador: a tela carrega com a CSP ativa, sem bloqueios.
- **Não verificado por mim:** o registro do service worker (funcionamento offline). O navegador embutido que uso para testar não permite service workers (nem um de teste vazio registra). Precisa ser conferido no Chrome do computador ou no celular: `npm run preview -- --host`, abrir o endereço, deixar carregar, ativar o modo avião e recarregar. Entra como item obrigatório da Fase 6.
- Ícones 192 e 512 gerados e conferidos.

## Observações
- `public/audio/index.json` só existe quando o gerador de áudio **termina**. Se você compilar antes disso, o app publicado não terá as falas gravadas (usa a voz do aparelho). Ordem certa na Fase 6: terminar o gerador → `npm run build` → publicar.
- O backup inclui o nome da criança (é o perfil). O aviso na tela diz isso antes de exportar.
- Alerta de estagnação ampla, álbum de figurinhas e gravação da voz do responsável seguem na v2, conforme a especificação.
