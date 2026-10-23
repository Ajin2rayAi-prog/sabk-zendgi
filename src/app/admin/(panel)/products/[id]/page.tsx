import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "../product-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "ویرایش محصول" };

export default async function EditProduct({ params }: { params: { id: string } }) {
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id: params.id } }),
    prisma.category.findMany({ orderBy: { order: "asc" } }),
  ]);
  if (!product) notFound();
  return <ProductForm product={product} categories={categories} />;
}
