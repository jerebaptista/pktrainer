# Configurar repositório no GitHub

Siga estes passos no terminal (PowerShell ou CMD) na pasta do projeto.

## 1. Inicializar o Git (se ainda não fez)

```bash
git init
```

## 2. Adicionar o remote do GitHub

```bash
git remote add origin https://github.com/jerebaptista/pktrainer.git
```

Se o repositório **pktrainer** ainda não existir no GitHub:

1. Acesse [github.com/new](https://github.com/new)
2. Nome do repositório: **pktrainer**
3. Crie o repositório (pode ser vazio, sem README)

## 3. Primeiro commit e push

```bash
git add .
git commit -m "Initial commit: PKtrainer - FireRed & LeafGreen"
git branch -M main
git push -u origin main
```

Se o GitHub pedir autenticação, use um **Personal Access Token** (em Settings → Developer settings → Personal access tokens) no lugar da senha.

---

**Resumo:** usuário **jerebaptista**, repositório **pktrainer**  
URL: https://github.com/jerebaptista/pktrainer
