import Link from "next/link";
import { adminDb } from "../lib/supabase-admin";
import ShareButtons from "./share-buttons";

export const dynamic = "force-dynamic";

export default async function Home() {
  const db = adminDb();
  const { data: posts } = await db.from("public_complaints")
    .select("id,reference_code,category,district,incident_month,public_summary,disclaimer,published_at,image_path")
    .is("deleted_at", null)
    .order("published_at", { ascending: false }).limit(30);

  const postsWithImages = await Promise.all((posts ?? []).map(async (post) => {
    if (!post.image_path) return { ...post, image_url: null };
    const { data } = await db.storage.from("complaint-images").createSignedUrl(post.image_path, 60 * 60);
    return { ...post, image_url: data?.signedUrl ?? null };
  }));

  const labels: Record<string,string> = {
    extortion:"চাঁদাবাজি", threat:"হুমকি", harassment:"হয়রানি",
    corruption:"দুর্নীতি সংক্রান্ত অভিযোগ", public_service:"জনসেবা", other:"অন্যান্য"
  };

  return <main className="wrap">
    <header className="hero">
      <h1>জনতার কণ্ঠ</h1>
      <p>অন্যায়ের কথা বলুন, নিরাপদে। অভিযোগ প্রকাশের আগে যাচাই ও পর্যালোচনা করা হয়।</p>
      <Link className="button" href="/complain">বেনামি অভিযোগ জমা দিন</Link>
    </header>
    <div className="notice">সতর্কতা: জরুরি বিপদে website-এর অপেক্ষা করবেন না। অভিযোগের বিবরণে কারও ফোন নম্বর, বাড়ির ঠিকানা, জাতীয় পরিচয়পত্র বা অপ্রয়োজনীয় পরিচয়-তথ্য লিখবেন না।</div>
    <h2>প্রকাশিত অভিযোগ</h2>
    <p className="muted">এখানে কেবল moderation-এর পর প্রকাশিত পরিচয়মুক্ত অভিযোগ দেখানো হয়। প্রকাশ মানেই অভিযোগ সত্য প্রমাণিত—এমন নয়।</p>
    {!postsWithImages.length && <div className="card">এখনো কোনো অভিযোগ প্রকাশিত হয়নি।</div>}
    {postsWithImages.map(p => <article className="card post" id={`post-${p.id}`} key={p.id}>
      <span className="tag">{labels[p.category] ?? "অভিযোগ"}</span>
      <h3>রেফারেন্স: {p.reference_code}</h3>
      <p className="muted">{[p.district, p.incident_month].filter(Boolean).join(" · ")}</p>
      <p style={{whiteSpace:"pre-wrap"}}>{p.public_summary}</p>
      {p.image_url && <img src={p.image_url} alt="অভিযোগের সঙ্গে জমা দেওয়া যাচাইকৃত ছবি" style={{width:"100%",maxHeight:460,objectFit:"contain",borderRadius:12,background:"#f4f7f5",marginTop:8}} />}
      <ShareButtons postId={p.id} reference={p.reference_code} summary={p.public_summary} siteUrl={process.env.SITE_URL || ""} />

      <p className="muted">{p.disclaimer}</p>
    </article>)}
    <footer className="muted">জনতার কণ্ঠ একটি স্বতন্ত্র উদ্যোগ; সরকারি ওয়েবসাইট নয়। <Link href="/privacy">গোপনীয়তা</Link> · <Link href="/complain">অভিযোগ জানান</Link> · <Link href="/admin">Admin</Link></footer>
  </main>;
}
