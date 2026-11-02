import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

export default async function PokemonNameRedirectPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const locale = await getLocale();
  redirect({ href: `/pokemon/${name.toLowerCase().trim()}`, locale });
}
