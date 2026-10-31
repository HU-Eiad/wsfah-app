import BottomNav from "@/components/BottomNav";
import MaterialIcon from "@/components/MaterialIcon";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const posts = await prisma.galleryPost.findMany({
    include: {
      author: { select: { id: true, name: true, image: true } },
      company: { select: { id: true, name: true, logo: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return (
    <div className="bg-background-light text-espresso min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 bg-background-light/85 backdrop-blur-md px-4 py-3 flex items-center gap-2 border-b border-espresso/10">
        <Link href="/" aria-label="رجوع" className="size-10 rounded-full flex items-center justify-center hover:bg-oat-milk">
          <MaterialIcon icon="arrow_forward" />
        </Link>
        <h1 className="text-xl flex-1">المعرض</h1>
      </header>

      <main className="flex-1 px-4 pb-28 pt-4">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <img src="/brand/banners/empty-state.svg" alt="" className="w-40 mx-auto mb-4" />
            <p className="text-sm font-semibold text-espresso/70">لا توجد منشورات بعد</p>
            <p className="text-xs text-espresso/60 mt-1">يمكن للمبدعين والعلامات التجارية مشاركة صورهم هنا</p>
          </div>
        ) : (
          <div className="columns-2 gap-3 space-y-3">
            {posts.map((post) => (
              <div key={post.id} className="break-inside-avoid rounded-[20px] overflow-hidden bg-surface border border-espresso/10">
                {post.imageUrl && <img src={post.imageUrl} alt={post.caption || "منشور المعرض"} className="w-full object-cover" />}
                <div className="p-3">
                  {post.caption && <p className="text-sm leading-relaxed mb-2" dir="auto">{post.caption}</p>}
                  <div className="flex items-center gap-2">
                    <img
                      src={post.author.image || "/brand/banners/avatar-placeholder.svg"}
                      alt=""
                      className="size-6 rounded-full object-cover bg-oat-milk ring-1 ring-espresso/10"
                    />
                    <span dir="auto" className="text-xs text-espresso/60 font-medium truncate">{post.author.name}</span>
                    {post.company && (
                      <Link href={`/brand/${post.company.id}`} dir="auto" className="text-xs text-primary font-bold ms-auto shrink-0">
                        {post.company.name}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
