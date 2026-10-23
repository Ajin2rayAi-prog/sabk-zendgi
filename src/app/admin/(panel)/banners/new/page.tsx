import { BannerForm } from "../banner-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "بنر جدید" };

export default async function NewBanner() {
  return <BannerForm banner={null} />;
}
