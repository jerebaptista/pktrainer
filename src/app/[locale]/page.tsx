import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const t = await getTranslations("Home");

  return (
    <div className="flex flex-1 flex-col p-6 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </header>

      <section className="flex flex-col gap-6">
        <h2 className="text-xl font-semibold text-foreground">{t("quickLinks")}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>{t("pokedexTitle")}</CardTitle>
              <CardDescription>{t("pokedexDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="secondary" size="sm">
                <Link href="/pokedex">{t("pokedexCta")}</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("movesTitle")}</CardTitle>
              <CardDescription>{t("movesDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="secondary" size="sm">
                <Link href="/moves">{t("movesCta")}</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("walkthroughTitle")}</CardTitle>
              <CardDescription>{t("walkthroughDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="secondary" size="sm">
                <Link href="/walkthrough">{t("walkthroughCta")}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mt-10 rounded-lg border border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        <p>
          {t("footer")}{" "}
          <a
            href="https://pokeapi.co/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground underline underline-offset-4 hover:no-underline"
          >
            PokéAPI
          </a>
          .
        </p>
      </section>
    </div>
  );
}
