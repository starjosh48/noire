"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Drawer } from "@/components/ui/drawer";
import { ArrowRightIcon, SearchIcon } from "@/components/ui/icons";
import { ProductImage } from "@/components/product/product-image";
import { familyLine } from "@/lib/catalog/taxonomy";
import type { ProductSummary } from "@/lib/catalog/types";
import { formatPrice, productLabel } from "@/lib/format";

const suggestions = ["Woody", "Amber", "Fresh", "Rose", "Vanilla", "Bergamot", "Date night"];

type Status = "idle" | "loading" | "done" | "error";

export function SearchPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductSummary[]>([]);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (open) {
      const id = window.setTimeout(() => inputRef.current?.focus(), 60);
      return () => window.clearTimeout(id);
    }
  }, [open]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) return;
    const controller = new AbortController();
    const id = window.setTimeout(async () => {
      setStatus("loading");
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(term)}&limit=5`, { signal: controller.signal });
        if (!response.ok) throw new Error(String(response.status));
        const data = (await response.json()) as { results: ProductSummary[] };
        setResults(data.results);
        setStatus("done");
      } catch (error) {
        if ((error as Error).name !== "AbortError") setStatus("error");
      }
    }, 180);
    return () => {
      controller.abort();
      window.clearTimeout(id);
    };
  }, [query]);

  const term = query.trim();
  const showResults = term.length >= 2;

  function submit(value: string) {
    const q = value.trim();
    if (!q) return;
    onClose();
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <Drawer open={open} onClose={onClose} title="Search" hideTitle side="top">
      <div className="shell pb-10 pt-6 md:pb-14 md:pt-10">
        <form
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            submit(query);
          }}
          className="flex items-center gap-3 border-b border-ink pb-3"
        >
          <label htmlFor={inputId} className="sr-only">
            Search fragrances
          </label>
          <SearchIcon size={22} className="shrink-0 text-muted" />
          <input
            ref={inputRef}
            id={inputId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, note or mood"
            autoComplete="off"
            enterKeyHint="search"
            className="w-full bg-transparent font-serif text-[28px] leading-tight text-ink placeholder:text-faint focus:outline-none md:text-[40px]"
          />
          <button
            type="submit"
            className="shrink-0 text-[12px] uppercase tracking-[0.16em] text-ink disabled:text-faint"
            disabled={!term}
          >
            Search
          </button>
        </form>

        <div className="mt-8 min-h-40" aria-live="polite">
          {!showResults && (
            <div>
              <p className="eyebrow text-muted">Popular searches</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => submit(s)}
                      className="border border-line px-4 py-2 text-[13px] text-ink transition-colors hover:border-ink"
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showResults && status === "loading" && results.length === 0 && (
            <p className="text-[14px] text-muted">Searching…</p>
          )}

          {showResults && status === "error" && (
            <p className="text-[14px] text-danger">Search is unavailable right now. Please try again.</p>
          )}

          {showResults && status === "done" && results.length === 0 && (
            <div>
              <p className="display text-[28px]">We couldn&rsquo;t find that scent.</p>
              <p className="mt-2 text-[14px] text-muted">Try searching for woody, amber, fresh or floral.</p>
            </div>
          )}

          {showResults && results.length > 0 && (
            <div>
              <p className="eyebrow text-muted">Fragrances</p>
              <ul className="mt-4 grid gap-x-8 gap-y-2 md:grid-cols-2">
                {results.map((product) => (
                  <li key={product.id}>
                    <Link
                      href={`/shop/${product.slug}`}
                      onClick={onClose}
                      className="group flex items-center gap-4 py-2"
                    >
                      <ProductImage
                        src={product.image_url}
                        alt=""
                        sizes="64px"
                        className="aspect-[4/5] w-14 shrink-0"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="eyebrow block text-muted">{productLabel(product.number)}</span>
                        <span className="block font-serif text-[20px] leading-tight group-hover:opacity-70">
                          {product.name}
                        </span>
                        <span className="block text-[12px] text-muted">
                          {familyLine(product.fragrance_family, product.secondary_family)}
                        </span>
                      </span>
                      <span className="shrink-0 text-[13px] tabular-nums text-ink">
                        <span className="text-muted">From </span>
                        {formatPrice(product.price)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => submit(query)}
                className="mt-6 inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.16em] text-ink link-underline"
              >
                See all results for &ldquo;{term}&rdquo; <ArrowRightIcon size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
