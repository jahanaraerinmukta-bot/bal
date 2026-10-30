import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "জনতার কণ্ঠ | নিরাপদে অভিযোগ জানান",
  description: "বাংলাদেশের জনস্বার্থমূলক অভিযোগ প্ল্যাটফর্ম। অভিযোগ প্রকাশের আগে পর্যালোচনা করা হয়।"
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="bn"><body>{children}</body></html>;
}
