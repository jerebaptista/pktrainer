# PKtrainer

Guia de Pokémon FireRed & LeafGreen com Pokédex, golpes, habilidades e base para detonados futuros.

- Next.js (App Router) + TypeScript + Tailwind + shadcn/ui
- PokéAPI com cache de 24h
- Interface em 9 idiomas via `next-intl` (rotas em inglês)
- Deploy na Vercel: [pktrainer.com](https://pktrainer.com)
- Supabase reservado para jogos/guias na próxima fase

## Idiomas

Inglês (sem prefixo), japonês, francês, italiano, alemão, espanhol, português do Brasil, chinês tradicional e coreano.

Exemplos: `/pokedex`, `/pokemon/25`, `/pt-BR/pokedex`, `/ja/pokemon/25`.

## Desenvolvimento

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

Variáveis do Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) só são necessárias quando as telas de guias forem ligadas ao banco. O schema inicial está em `supabase/migrations/`. A criação automática do projeto remoto ficou pendente porque a conta já está no limite de projetos free ativos.

## Scripts

- `npm run dev` — servidor local
- `npm run build` — build de produção
- `npm run lint` — ESLint
