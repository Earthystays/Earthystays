import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { setWishlist } from "@/lib/data/users";
import { getVillaBySlug } from "@/lib/data/villas";
import { revalidatePath } from "next/cache";

type Ctx = { params: Promise<{ slug: string }> };

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) return null;
  return user;
}

export async function POST(_req: Request, { params }: Ctx) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  const { slug } = await params;
  if (!getVillaBySlug(slug)) {
    return NextResponse.json({ ok: false, error: "Villa not found" }, { status: 404 });
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
