import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BannerForm } from "../banner-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "ویرایش بنر" };

export default async function EditBanner({ params }: { params: { id: string } }) {
  const banner = await prisma.bannerSlide.findUnique({ where: { id: params.id } });
  if (!banner) notFound();
  return <BannerForm banner={banner} />;
}
