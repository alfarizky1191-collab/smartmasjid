import { redirect } from "next/navigation";

/**
 * Permanent redirect: /m/[slug] → /masjid/[slug]
 *
 * The canonical public mosque profile is now at /masjid/[slug].
 * This file exists only to forward any old links or bookmarks.
 */
type Props = { params: Promise<{ slug: string }> };

export default async function LegacyMosquePage({ params }: Props) {
  const { slug } = await params;
  redirect(`/masjid/${slug}`);
}
