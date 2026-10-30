'use client';
import { useState } from "react";
export default function ComplaintForm() {
  const [message,setMessage] = useState("");
  const [busy,setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setMessage("");
    const form = e.currentTarget;
    try {
      const res = await fetch("/api/complaints", { method:"POST", body:(() => { const fd = new FormData(form); return fd; })() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "জমা দেওয়া যায়নি");
      setMessage("অভিযোগ জমা হয়েছে। রেফারেন্স: " + json.reference_code + "। এটি এখনো প্রকাশিত হয়নি; Admin যাচাই করবেন।");
      form.reset();
    } catch (err) { setMessage(err instanceof Error ? err.message : "সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।"); }
    finally { setBusy(false); }
  }
  return <form className="card" onSubmit={submit}>
    <label>অভিযোগের ধরন</label>
    <select name="category" required defaultValue="">
      <option value="" disabled>বেছে নিন</option>
      <option value="extortion">চাঁদাবাজি / জোর করে টাকা দাবি</option>
      <option value="threat">হুমকি / ভয়ভীতি</option>
      <option value="harassment">হয়রানি</option>
      <option value="corruption">দুর্নীতি সংক্রান্ত অভিযোগ</option>
      <option value="public_service">জনসেবা সংক্রান্ত সমস্যা</option>
      <option value="other">অন্যান্য</option>
    </select>
    <div className="grid">
      <div><label>জেলা (ঐচ্ছিক)</label><input name="district" maxLength={80} placeholder="যেমন: কুমিল্লা"/></div>
      <div><label>ঘটনার তারিখ (ঐচ্ছিক)</label><input name="incident_date" type="date"/></div>
    </div>
    <label>ঘটনার ছবি (ঐচ্ছিক)</label>
    <input name="image" type="file" accept="image/jpeg,image/png,image/webp" />
    <p className="muted">JPG, PNG বা WebP; সর্বোচ্চ ৫ MB। Admin যাচাই করে প্রকাশ করলে তবেই ছবিটি দেখা যাবে। মুখ, ফোন নম্বর, ঠিকানা বা ব্যক্তিগত নথি থাকা ছবি দেবেন না।</p>
    <label>ঘটনার বিবরণ</label>
    <textarea name="narrative" minLength={30} maxLength={5000} required placeholder="কী ঘটেছে, কখন ও কোথায় ঘটেছে—সংক্ষেপে লিখুন। নাম, ফোন নম্বর, ঠিকানা বা জাতীয় পরিচয়পত্র লিখবেন না।"/>
    <label style={{display:"flex",gap:8,alignItems:"start",fontWeight:400}}><input style={{width:18,marginTop:4}} type="checkbox" required/> আমি বুঝেছি যে অভিযোগটি প্রথমে Admin যাচাই করবেন এবং পরিচয়-ঝুঁকি বা আইনগত ঝুঁকি থাকলে সম্পাদনা/প্রকাশ প্রত্যাখ্যান করা হতে পারে।</label>
    <p><button disabled={busy}>{busy ? "জমা হচ্ছে…" : "নিরাপদে অভিযোগ জমা দিন"}</button></p>
    {message && <p role="status">{message}</p>}
  </form>;
}
