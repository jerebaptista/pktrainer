import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col p-6 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Welcome to PKtrainer
        </h1>
        <p className="mt-2 text-muted-foreground">
          Your guide to Pokémon FireRed &amp; LeafGreen — Pokédex, moves, abilities, locations, and walkthrough.
        </p>
      </header>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-foreground">Quick links</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Pokédex</CardTitle>
              <CardDescription>Browse all Pokémon from FireRed &amp; LeafGreen.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="secondary" size="sm">
                <Link href="/pokedex">Open Pokédex</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Moves</CardTitle>
              <CardDescription>Search moves by type, power, and effect.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="secondary" size="sm">
                <Link href="/moves">View moves</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Walkthrough</CardTitle>
              <CardDescription>Step-by-step story and region guide.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="secondary" size="sm">
                <Link href="/walkthrough">Start guide</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mt-10 rounded-lg border border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        <p>
          FireRed &amp; LeafGreen release on Nintendo Switch on February 27. This site uses the{" "}
          <a
            href="https://pokeapi.co/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground underline underline-offset-4 hover:no-underline"
          >
            PokéAPI
          </a>{" "}
          for data.
        </p>
      </section>
    </div>
  );
}
