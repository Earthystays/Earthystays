import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { setWishlist } from "@/lib/data/users";
import { getVillaBySlug } from "@/lib/data/villas";
import { getExperienceBySlug } from "@/lib/data/experiences";
import { revalidatePath } from "next/cache";

type Ctx = { params: Promise<{ slug: string }> };

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) return null;
  return user;
}

function exists(slug: string, type: string | null): boolean {
  return type === "experience" ? Boolean(getExperienceBySlug(slug)) : Boolean(getVillaBySlug(slug));
}

export async function POST(req: Request, { params }: Ctx) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  const { slug } = await params;
  const type = new URL(req.url).searchParams.get("type");
  if (!exists(slug, type)) {
    return NextResponse.json(
      { ok: false, error: type === "experience" ? "Experience not found" : "Villa not found" },
      { status: 404 },
    );
  }
  const wishlist = await setWishlist(user.id, (curr) =>
    curr.includes(slug) ? curr : [...curr, slug],
  );
  revalidatePath("/wishlist");
  return NextResponse.json({ ok: true, wishlist });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  const { slug } = await params;
  const wishlist = await setWishlist(user.id, (curr) => curr.filter((s) => s !== slug));
  revalidatePath("/wishlist");
  return NextResponse.json({ ok: true, wishlist });
}
