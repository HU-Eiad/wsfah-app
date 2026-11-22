import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";

// Server wrapper so the client recipe page gets per-recipe title and share cards.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const t = await getTranslations("meta");

  let recipe: { id: string; title: string; description: string | null; imageUrl: string | null } | null = null;
  try {
    recipe = await prisma.recipe.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { id: true, title: true, description: true, imageUrl: true },
    });
  } catch {
    recipe = null;
  }

  if (!recipe) {
    return { title: t("recipeNotFound"), robots: { index: false } };
  }

  const title = `${recipe.title} | ${t("siteName")}`;
  const description = (recipe.description || t("description")).slice(0, 200);
  const images = recipe.imageUrl ? [{ url: recipe.imageUrl, alt: recipe.title }] : undefined;
  const url = `/recipe/${recipe.id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      siteName: t("siteName"),
      images,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title,
      description,
      images: images?.map((i) => i.url),
    },
  };
}

export default function RecipeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
