import { Metadata } from "next";
import SinglePlatformScene from "@/scenes/single-platform";

export const metadata: Metadata = {
  title: "صفحه رسمی پلتفرم ملک تودی | MelkToday Official",
  description: "اطلاعیه‌ها، اخبار رسمی و راه‌های ارتباطی سامانه جامع املاک و اقامتگاه‌های گردشگری ملک‌تودی",
};

export default function PlatformPage() {
  return <SinglePlatformScene />;
}
