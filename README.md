# Tech-Game

Projeto educacional desenvolvido em React + TypeScript + Vite.

## Executar no GitHub Codespaces

1. No repositório da equipe, clique em **Code > Codespaces > Create codespace on main**.
2. Aguarde o ambiente ser preparado. O Codespaces tentará executar `npm install` automaticamente.
3. No terminal, execute:

```bash
npm start
```

4. Abra a porta **5173** em **PORTS / PORTAS > Open in Browser**.

## Se as dependências ainda não estiverem instaladas

```bash
npm install
npm start
```

## Build de produção

```bash
npm run build
```

A pasta gerada será `dist/`.

## GitHub Pages

O Vite foi configurado com `base: './'` para facilitar uma futura publicação como site de projeto no GitHub Pages.

## Importante

- Não envie `node_modules/` para o GitHub.
- Não use `npm audit fix --force` sem testar as alterações.
- Antes de editar código em equipe, sincronize o repositório com `git pull origin main`.
