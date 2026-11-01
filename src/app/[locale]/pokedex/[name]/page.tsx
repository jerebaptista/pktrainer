import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { fetchKantoPokemon } from "@/lib/pokeapi";

/** Evita ISR com payload grande (dados completos do Pokémon + moves). */
export const dynamic = "force-dynamic";

export default async function PokemonNameRedirectPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const locale = await getLocale();
  const slug = name.toLowerCase().trim();
  const all = await fetchKantoPokemon();
  const pokemon = all.find((p) => p.name.toLowerCase() === slug);
  if (!pokemon) notFound();

  redirect({ href: `/pokemon/${pokemon.id}`, locale });
}
