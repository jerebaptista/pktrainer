"use client";

import type { ReactNode } from "react";

export type SectionTableLayoutProps = {
  /** Título da seção (ex.: "Pokémon", "Items") */
  title: string;
  /** Quantidade exibida ao lado do título (opcional). Se omitido, só o título é mostrado. */
  count?: number;
  /** Área de filtros (ex.: barra com search, tipos, colunas). */
  filters?: ReactNode;
  /** Conteúdo da tabela: o elemento <table> com colgroup, thead e tbody. */
  children: ReactNode;
};

/**
 * Layout padrão de seção com tabela: título (com contagem opcional), filtros e área
 * com scroll. A altura da tabela varia com o conteúdo (mín.) até preencher o espaço (máx.);
 * o scroll vertical fica apenas dentro da área da tabela.
 * Reutilizável em Pokédex, Items, Abilities, Moves etc.: cada página define
 * colunas, larguras e filtros.
 */
export function SectionTableLayout({
  title,
  count,
  filters,
  children,
}: SectionTableLayoutProps) {
  return (
    <div className="flex min-h-0 min-w-0 h-0 flex-1 flex-col gap-4">
      <header className="shrink-0">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
          {count != null && (
            <span
              className="text-2xl font-normal text-primary"
              aria-live="polite"
            >
              {count === 0 ? "Missing" : count}
            </span>
          )}
          <span>{title}</span>
        </h1>
      </header>

      {filters != null && (
        <div className="shrink-0 overflow-visible">{filters}</div>
      )}

      <div className="min-h-0 min-w-0 flex-1 flex flex-col overflow-hidden">
        <div className="min-w-0 max-h-full w-full overflow-auto self-start">
          {children}
        </div>
      </div>
    </div>
  );
}
