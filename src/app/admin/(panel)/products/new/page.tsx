import { prisma } from "@/lib/prisma";
import { ProductForm } from "../product-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "محصول جدید" };

export default async function NewProduct() {
  const categories = await prisma.category.findMany({ orderBy: { order: "asc" } });
  return <ProductForm product={null} categories={categories} />;
}
