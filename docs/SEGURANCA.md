# Segurança do app: análise e medidas

Resposta curta: **o app é seguro por desenho**, porque não tem servidor, não tem conta, não tem internet depois de instalado e não guarda nada sensível. O risco não está em "alguém invadir o app"; está em três lugares: o aparelho em si, o arquivo de backup e a cadeia de ferramentas usada para construir. Abaixo, o que existe de risco, o que o desenho já elimina e o que vou implementar além disso.

---

## 1. Que dados o app guarda

| Dado | Sensibilidade | Onde fica |
|---|---|---|
| Primeiro nome e apelido da criança | Baixa–média (identifica a criança) | IndexedDB do navegador, no aparelho |
| Avatar (desenho escolhido) | Nenhuma | idem |
| Tentativas (acertou/errou, quando, em quê) | Baixa; é dado de desempenho de uma criança, merece cuidado | idem |
| Registro "Fizemos!" | Nenhuma | idem |
| Configurações (limite diário, voz) | Nenhuma | idem |

**Não existe:** data de nascimento, sobrenome, foto, localização, e-mail, senha, qualquer dado do responsável.

Decisão: o cadastro **não pede data de nascimento nem sobrenome**. Idade não é necessária para o motor. Quanto menos dado, menos risco.

---

## 2. Onde o risco realmente está

### 2.1 Saída de dados do aparelho
- **Sem servidor, sem analytics, sem login.** Não há para onde os dados irem. Isso é verificável: a aba "Rede" do navegador deve mostrar **zero requisições** depois do primeiro carregamento, exceto a verificação de atualização do próprio app no GitHub Pages (que não envia dados, só pergunta "tem versão nova?").
- **Síntese de voz:** único vazamento possível. A voz "Google português" no Chrome de computador manda o texto para o Google. O app **só usa vozes locais** (`localService === true`). O texto falado seria só "toca no vermelho", mas a regra é não vazar nada.
- **Fontes e ícones:** tudo empacotado no app. Nenhum CDN, nenhuma fonte do Google Fonts carregada da internet.
- **Medida técnica:** `Content-Security-Policy` na `index.html` com `default-src 'self'; connect-src 'self'; img-src 'self' data:; media-src 'self' blob:`. Isso faz o navegador **bloquear** qualquer conexão a outro domínio, mesmo que algum pacote tente. É a garantia mecânica, não só promessa.
- **Teste automatizado:** busca no código-fonte final por `http://` e `https://` fora da lista permitida (apenas as URLs de atribuição na tela Sobre, como texto).

### 2.2 O aparelho
- Quem tem o celular desbloqueado tem o progresso da criança. Isso vale para qualquer app. Não há como o app proteger contra isso sem senha, e senha numa criança de 4 anos não faz sentido.
- O painel dos pais tem um **gesto de bloqueio** (segurar 3 s + conta). Isso protege contra **a criança**, não contra um adulto. É o objetivo correto: impedir que a criança apague o perfil ou mude o limite diário.
- Recomendação para você: bloqueio de tela no celular, que você provavelmente já tem.

### 2.3 O arquivo de backup
É o único momento em que os dados saem do app, por decisão sua. Riscos: você mandar o arquivo para si mesma por WhatsApp/e-mail, e ele ficar na nuvem.
- O arquivo contém só o que está na tabela da seção 1. Sem senha, sem nada reutilizável.
- **Medida:** o backup é um JSON legível, para você poder abrir e ver exatamente o que tem. O painel mostra, antes de exportar, a frase "Este arquivo contém o nome da criança e o histórico de atividades. Guarde-o em local privado."
- **Importação:** o app valida o arquivo (estrutura, tipos, tamanho máximo de 20 MB) antes de aceitar. Um arquivo malformado é recusado com mensagem clara; nunca é executado, só lido como dados.

### 2.4 Conteúdo e injeção
- O único texto que entra no app vindo de pessoa é o **nome e apelido** da criança. Eles são exibidos no painel e falados pelo narrador. React escapa texto por padrão, então `<script>` no nome vira texto literal. Mesmo assim: limite de 30 caracteres, só letras, espaço, hífen e acentos.
- Nenhum `dangerouslySetInnerHTML`. Os SVGs são componentes, não strings injetadas.

### 2.5 Cadeia de ferramentas (o risco mais real)
O app é construído com pacotes do `npm` (React, Vite, Dexie…). Um pacote malicioso poderia inserir código. Medidas:
- **Poucas dependências de produção:** React, React-DOM, Dexie. Só. Tudo o mais é ferramenta de desenvolvimento (Vite, Vitest, TypeScript, vite-plugin-pwa).
- `package-lock.json` versionado, `npm ci` na publicação (instala exatamente o que foi testado).
- `npm audit` antes de cada publicação; publicação bloqueada com vulnerabilidade alta ou crítica.
- A CSP da seção 2.1 limita o dano mesmo se algo passar: um pacote comprometido não consegue mandar dados para fora.

### 2.6 Publicação (GitHub Pages)
- O repositório pode ser **público ou privado**; GitHub Pages funciona nos dois com conta gratuita? **Não**: Pages em repositório privado exige plano pago. Então o repositório será **público**. O que fica público é o **código**, nunca os dados: o progresso da criança está só no celular. O nome dele **não** vai para o código (é digitado no painel).
- HTTPS obrigatório (GitHub fornece). PWA só instala em HTTPS.
- Acesso à conta GitHub: ative verificação em duas etapas, se ainda não tiver. É a única credencial de todo o projeto.

### 2.7 Segurança da criança (não só de dados)
- Sem links externos em nenhuma tela da criança. A tela Sobre, com os links de atribuição, fica dentro do painel protegido.
- Sem compras, sem anúncios, sem conteúdo baixado da internet depois de instalado. Não há como aparecer algo que eu não coloquei.
- Limite diário e sessões curtas são a segurança de **tempo de tela**.
- Sem câmera, microfone (na v1), localização ou notificações: o app **não pede nenhuma permissão** ao Android. Se um dia pedir, algo está errado.

---

## 3. O que não é problema e por quê

- **"Alguém pode hackear o app?"** Não há o que hackear: não há servidor, conta ou dado remoto. O atacante precisaria do celular na mão.
- **"O Google vê o que a criança faz?"** Não. Com a CSP e as vozes locais, nenhuma requisição sai. O Chrome em si (navegador) tem as políticas de privacidade do Google, como com qualquer site, mas o app não envia nada por conta própria.
- **LGPD:** uso doméstico, dado que não sai do aparelho, sem coleta por terceiro. Não há tratamento de dados por mim nem por serviço. Se um dia for distribuído para outras famílias, aí sim precisa de política de privacidade; o desenho atual já cumpriria o que ela diria.

---

## 4. Resumo das medidas que entram na especificação (seção 20)

1. CSP restritiva na `index.html`.
2. Só vozes locais; aviso no painel se não houver pt-BR local.
3. Nenhum recurso externo (fontes, ícones, scripts) em tempo de execução; teste automatizado de URLs.
4. Cadastro mínimo: primeiro nome e apelido, 30 caracteres, sem data de nascimento.
5. Validação completa do arquivo de backup na importação; limite de 20 MB.
6. Aviso de privacidade antes de exportar backup.
7. Três dependências de produção; `npm ci`; `npm audit` bloqueante na publicação.
8. Nenhuma permissão do Android solicitada na v1.
9. Links externos só na tela Sobre, dentro do painel.
10. Repositório público sem nenhum dado pessoal; nome da criança nunca no código.
