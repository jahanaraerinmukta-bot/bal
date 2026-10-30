import { createClientForServer } from "../../lib/supabase-server";
import { adminDb } from "../../lib/supabase-admin";
import { publishComplaint, rejectComplaint, signIn, signOut, editPublicPost, movePostToTrash, restorePublicPost, permanentlyDeletePost } from "./actions";
import ConfirmForm from "./confirm-form";

export const dynamic = "force-dynamic";
type Params = { error?: string; updated?: string; trashed?: string; restored?: string; deleted?: string };
export default async function AdminPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const supabase = await createClientForServer();
  const { data: { user } } = await supabase.auth.getUser();
  const allow = (process.env.ADMIN_EMAILS || "").split(",").map(x => x.trim().toLowerCase()).filter(Boolean);
  if (!user || !user.email || !allow.includes(user.email.toLowerCase())) {
    return <main className="wrap"><div className="hero"><h1>Admin Login</h1><p>শুধু অনুমোদিত Admin-এর জন্য।</p></div>
      {params.error && <p className="error">Login বা অনুরোধে সমস্যা হয়েছে।</p>}
      <form className="card" action={signIn}><label>Email</label><input name="email" type="email" required autoComplete="username"/><label>Password</label><input name="password" type="password" required autoComplete="current-password"/><p><button>Login</button></p></form>
    </main>;
  }
  const db = adminDb();
  const [{ data: items }, { data: posts }, { data: trash }] = await Promise.all([
    db.from("complaint_submissions").select("id,reference_code,category,district,incident_date,narrative,image_path,created_at").eq("status", "pending").order("created_at", { ascending: true }).limit(100),
    db.from("public_complaints").select("id,reference_code,category,district,incident_month,public_summary,published_at").is("deleted_at", null).order("published_at", { ascending: false }).limit(200),
    db.from("public_complaints").select("id,reference_code,category,district,public_summary,deleted_at").not("deleted_at", "is", null).order("deleted_at", { ascending: false }).limit(200)
  ]);
  const pendingWithImages = await Promise.all((items ?? []).map(async item => {
    if (!item.image_path) return { ...item, image_url: null };
    const { data } = await db.storage.from("complaint-images").createSignedUrl(item.image_path, 60 * 60);
    return { ...item, image_url: data?.signedUrl ?? null };
  }));
  const labels: Record<string, string> = { extortion: "চাঁদাবাজি", threat: "হুমকি", harassment: "হয়রানি", corruption: "দুর্নীতি সংক্রান্ত অভিযোগ", public_service: "জনসেবা", other: "অন্যান্য" };
  const errorText: Record<string, string> = { summary: "সারাংশ ৩০–২০০০ অক্ষরের হতে হবে।", edit: "পোস্ট edit করা যায়নি।", trash: "পোস্ট Trash-এ নেওয়া যায়নি।", restore: "পোস্ট restore করা যায়নি।", delete: "স্থায়ীভাবে delete করা যায়নি।", "not-in-trash": "স্থায়ীভাবে delete করার আগে পোস্টটি Trash-এ থাকতে হবে।", invalid: "অনুরোধটি সঠিক নয়।", publish: "প্রকাশ করা যায়নি।", reject: "প্রত্যাখ্যান করা যায়নি।", missing: "অভিযোগটি আর pending নেই।", login: "Login ব্যর্থ হয়েছে।" };
  return <main className="wrap">
    <div className="hero"><h1>জনতার কণ্ঠ — Admin</h1><p>Logged in: {user.email}. প্রকাশের আগে ব্যক্তিগত তথ্য বাদ দিন।</p><form action={signOut}><button className="secondary">Logout</button></form></div>
    {params.error && <p className="error">{errorText[params.error] || "কাজটি সম্পন্ন হয়নি।"}</p>}
    {params.updated && <p className="notice">পোস্ট আপডেট হয়েছে।</p>}{params.trashed && <p className="notice">পোস্ট Recycle Bin-এ নেওয়া হয়েছে।</p>}{params.restored && <p className="notice">পোস্ট Restore হয়েছে।</p>}{params.deleted && <p className="notice">পোস্ট স্থায়ীভাবে delete হয়েছে।</p>}

    <h2>Pending অভিযোগ ({items?.length || 0})</h2>
    {!items?.length && <div className="card">কোনো pending অভিযোগ নেই।</div>}
    {pendingWithImages.map(item => <section className="card" key={item.id}>
      <span className="tag">{labels[item.category] || "অভিযোগ"}</span><h3>{item.reference_code}</h3>
      <p className="muted">{item.district || "জেলা উল্লেখ নেই"} · {item.incident_date || "তারিখ উল্লেখ নেই"}</p><p style={{ whiteSpace: "pre-wrap" }}>{item.narrative}</p>{item.image_url && <img src={item.image_url} alt="Pending complaint attachment" style={{width:"100%",maxHeight:400,objectFit:"contain",borderRadius:12,marginBottom:12}} />}
      <div className="notice">প্রকাশের আগে নাম, ফোন, ঠিকানা, পরিচয় শনাক্তকারী বর্ণনা ও অপ্রয়োজনীয় অভিযোগমূলক দাবি বাদ দিন।</div>
      <form action={publishComplaint}><input type="hidden" name="id" value={item.id}/><label>পরিচয়মুক্ত Public Summary (এটাই প্রকাশ হবে)</label><textarea name="public_summary" minLength={30} maxLength={2000} required placeholder="শুধু প্রয়োজনীয় ঘটনা লিখুন। কারও নাম বা ব্যক্তিগত তথ্য নয়।"/><button>যাচাই করে প্রকাশ করুন</button></form>
      <form action={rejectComplaint} style={{ marginTop: 12 }}><input type="hidden" name="id" value={item.id}/><button className="secondary">প্রকাশ প্রত্যাখ্যান করুন</button></form>
    </section>)}

    <h2>প্রকাশিত পোস্ট ({posts?.length || 0})</h2>
    {!posts?.length && <div className="card">কোনো প্রকাশিত পোস্ট নেই।</div>}
    {posts?.map(post => <section className="card" key={post.id}>
      <span className="tag">{labels[post.category] || "অভিযোগ"}</span><h3>{post.reference_code}</h3><p className="muted">{post.district || "জেলা উল্লেখ নেই"} · {post.incident_month || "তারিখ উল্লেখ নেই"}</p>
      <form action={editPublicPost}><input type="hidden" name="post_id" value={post.id}/><label>প্রকাশিত সারাংশ edit করুন</label><textarea name="public_summary" defaultValue={post.public_summary} minLength={30} maxLength={2000} required/><button>পরিবর্তন Save করুন</button></form>
      <form action={movePostToTrash} style={{ marginTop: 12 }}><input type="hidden" name="post_id" value={post.id}/><button className="secondary">Recycle Bin-এ পাঠান</button></form>
    </section>)}

    <h2>Recycle Bin ({trash?.length || 0})</h2><p className="muted">Trash-এ থাকা পোস্ট public website-এ দেখা যাবে না। Restore করলে আবার দেখা যাবে। Permanently delete করলে আর ফিরিয়ে আনা যাবে না।</p>
    {!trash?.length && <div className="card">Recycle Bin খালি।</div>}
    {trash?.map(post => <section className="card" key={post.id}>
      <span className="tag">{labels[post.category] || "অভিযোগ"}</span><h3>{post.reference_code}</h3><p style={{ whiteSpace: "pre-wrap" }}>{post.public_summary}</p><p className="muted">Trash-এ নেওয়া হয়েছে: {post.deleted_at ? new Date(post.deleted_at).toLocaleString("bn-BD") : "—"}</p>
      <form action={restorePublicPost}><input type="hidden" name="post_id" value={post.id}/><button>Restore করুন</button></form>
      <ConfirmForm action={permanentlyDeletePost} id={post.id} label="Permanently Delete" confirmText="সতর্কতা: এই পোস্ট স্থায়ীভাবে মুছে যাবে এবং Restore করা যাবে না। নিশ্চিত?" />
    </section>)}
  </main>;
}
