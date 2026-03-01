import { notFound } from "next/navigation";
import { fetchKantoPokemon } from "@/lib/pokeapi";
import { PokemonDetailView } from "./pokemon-detail-view";

export const metadata = {
  title: "Pokémon – PKtrainer",
  description: "Pokédex for Pokémon FireRed & LeafGreen (Kanto).",
};

export default async function PokemonDetailPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const slug = name.toLowerCase().trim();

  const all = await fetchKantoPokemon();
  const pokemon = all.find((p) => p.name.toLowerCase() === slug);
  if (!pokemon) notFound();

  const allNames = all.map((p) => p.name);
  // Garantir objeto serializável ao passar para Client Component
  const serialized = JSON.parse(JSON.stringify(pokemon)) as typeof pokemon;

  return (
    <div className="flex flex-1 flex-col p-6 md:p-8">
      <PokemonDetailView key={pokemon.name} pokemon={serialized} allNames={allNames} />
    </div>
  );
}
