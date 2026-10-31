"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Promotion {
  id: string;
  placement: string;
  message: string | null;
  imageUrl: string | null;
  company: {
    id: string;
    name: string;
    logo: string | null;
    type: string;
    description: string | null;
  };
}

interface PromotedBrandsProps {
  placement: "HOME_TOP" | "EXPLORE_TOP";
}

export default function PromotedBrands({ placement }: PromotedBrandsProps) {
  const [promos, setPromos] = useState<Promotion[]>([]);

  useEffect(() => {
    fetch("/api/promotions")
      .then((r) => r.json())
      .then((data: Promotion[]) => {
        const filtered = data.filter(
          (p) => p.placement === placement || p.placement === "BOTH"
        );
        setPromos(filtered);
      })
      .catch(() => {});
  }, [placement]);

  if (promos.length === 0) return null;

  return (
    <section className="mb-8" aria-label="علامات مُروَّجة">
      <p className="text-[11px] text-espresso/60 mb-2">مُروَّج</p>
      <div className="flex overflow-x-auto gap-3 no-scrollbar -mx-2 px-2">
        {promos.map((p) => (
          <Link
            key={p.id}
            href={`/brand/${p.company.id}`}
            className="shrink-0 w-72 bg-surface border border-espresso/10 rounded-2xl overflow-hidden hover:border-primary/40 transition-colors group"
          >
            {p.imageUrl ? (
              <div className="h-28 bg-cover bg-center" style={{ backgroundImage: `url('${p.imageUrl}')` }} />
            ) : (
              <div className="h-28 bg-oat-milk flex items-center justify-center">
                <img
                  src={p.company.logo || "/brand/banners/avatar-placeholder.svg"}
                  alt={p.company.name}
                  className="size-16 rounded-full ring-1 ring-espresso/10 object-cover"
                />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-1">
                {!p.imageUrl && p.company.logo && (
                  <img src={p.company.logo} alt="" className="size-6 rounded-full object-cover" />
                )}
                <h4 className="font-bold text-sm group-hover:text-primary transition-colors truncate" dir="auto">
                  {p.company.name}
                </h4>
                <span className="text-[11px] text-espresso/60 ms-auto shrink-0">
                  إعلان
                </span>
              </div>
              {p.company.description && (
                <p className="text-xs text-espresso/60 line-clamp-2 mt-1 leading-relaxed" dir="auto">
                  {p.company.description}
                </p>
              )}
              {p.message && (
                <p className="text-xs text-primary mt-2 line-clamp-1" dir="auto">
                  {p.message}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
