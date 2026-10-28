# Fase 6: publicar e instalar no celular

Tudo de graça: o código fica num repositório **público** no GitHub (só código e áudios; nenhum dado da criança) e o GitHub Pages serve o app em `https://<seu-usuario>.github.io/app-aprender/`.

## Parte 1: criar o repositório (uma vez, no navegador)

1. Entre em https://github.com com a sua conta.
2. Canto superior direito, **+** → **New repository**.
3. **Repository name:** `app-aprender` (exatamente assim: o app é compilado para esse endereço).
4. **Public**. Não marque "Add a README", nem .gitignore, nem licença (o projeto já tem tudo).
5. **Create repository**. Deixe a página aberta; ela mostra o seu usuário na URL.

## Parte 2: enviar o projeto (uma vez, no PowerShell)

Troque `SEU-USUARIO` pelo seu nome de usuário do GitHub (o que aparece na URL):

```
cd E:\CLAUDE\app-aprender
git remote add origin https://github.com/SEU-USUARIO/app-aprender.git
git push -u origin main
```

No primeiro `push` o Windows abre uma janela do GitHub pedindo login (Git Credential Manager). Entre com a sua conta e autorize; depois disso não pede mais.

## Parte 3: ligar o GitHub Pages (uma vez, no navegador)

1. No repositório: **Settings** → **Pages** (menu da esquerda).
2. Em **Build and deployment → Source**, escolha **GitHub Actions**.
3. Aba **Actions** do repositório: a ação "Publicar no GitHub Pages" roda sozinha (uns 2 minutos). Verde = publicado.
4. O endereço fica: `https://SEU-USUARIO.github.io/app-aprender/`

A partir daí, **todo `git push` na main republica** (testes + build + publicação). Se as gravações estiverem incompletas, o build falha de propósito e nada é publicado.

## Parte 4: instalar no celular (Android, Chrome)

1. Abra o endereço no Chrome do celular. Toque em "Toca para começar" uma vez.
2. Menu do Chrome (⋮) → **Instalar app** (ou "Adicionar à tela inicial") → **Instalar**.
3. Aparece o ícone "Aprender" na tela inicial. Abra por ele: tela cheia, sem barra de endereço.
4. **Teste offline:** com o app aberto pelo ícone, ative o **modo avião** e feche e abra o app de novo. Deve abrir e falar normalmente (todos os 987 áudios ficam guardados no aparelho na primeira abertura; são 17 MB, então faça a primeira abertura no Wi-Fi).
5. O progresso da criança fica **nesse aparelho**. O perfil é criado na primeira abertura (painel → Cadastrar). Faça um backup de vez em quando (painel → Dados).

iPhone/iPad (se um dia precisar): Safari → botão Compartilhar → "Adicionar à Tela de Início". Sem isso o Safari pode apagar o progresso depois de 7 dias sem uso.

## Parte 5: atualizações

Quando eu mudar algo e fizer `git push`, o celular pega a versão nova sozinho na próxima abertura com internet (o service worker atualiza em segundo plano; às vezes só na segunda abertura).

## Verificação de segurança antes de publicar (feita)

- Nenhum arquivo do repositório contém o nome da criança (teste automatizado + gravações sem nome).
- O build tem CSP restritiva: o app publicado não acessa nenhum domínio externo.
- Nenhum dado de uso sai do aparelho; não há servidor nem analytics.
- Recomendação: ative a verificação em duas etapas na conta do GitHub (Settings → Password and authentication).
