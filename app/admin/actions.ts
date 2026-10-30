'use server';
import { redirect } from "next/navigation";
import { createClientForServer } from "../../lib/supabase-server";
import { adminDb } from "../../lib/supabase-admin";

async function requireAdmin() {
  const supabase = await createClientForServer();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user?.email) redirect("/admin?error=login");
  const allowed = (process.env.ADMIN_EMAILS || "").split(",").map(x => x.trim().toLowerCase()).filter(Boolean);
  if (!allowed.includes(user.email.toLowerCase())) redirect("/?error=unauthorized");
  return user;
}

function formString(formData: FormData, key: string, max = 2000) {
  return String(formData.get(key) || "").trim().slice(0, max);
}
function validId(id: string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id); }

export async function signIn(formData: FormData) {
  const email = formString(formData, "email", 254);
  const password = String(formData.get("password") || "");
  const supabase = await createClientForServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/admin?error=login");
  // Allowlist is checked on every privileged action, not just on login.
  await requireAdmin();
  redirect("/admin");
}
export async function signOut() {
  await createClientForServer().then(s => s.auth.signOut());
  redirect("/admin");
}
export async function rejectComplaint(formData: FormData) {
  await requireAdmin();
  const id = formString(formData, "id", 64);
  if (!validId(id)) redirect("/admin?error=invalid");
  const db = adminDb();
  const { error } = await db.from("complaint_submissions").update({ status: "rejected", reviewed_at: new Date().toISOString() }).eq("id", id).eq("status", "pending");
  if (error) redirect("/admin?error=reject");
  redirect("/admin");
}
export async function publishComplaint(formData: FormData) {
  await requireAdmin();
  const id = formString(formData, "id", 64);
  const summary = formString(formData, "public_summary", 2000);
  if (!validId(id)) redirect("/admin?error=invalid");
  if (summary.length < 30) redirect("/admin?error=summary");
  const db = adminDb();
  const { data: sub, error: subError } = await db.from("complaint_submissions").select("id,reference_code,category,district,incident_date,image_path,status").eq("id", id).eq("status", "pending").single();
  if (subError || !sub) redirect("/admin?error=missing");
  const month = sub.incident_date ? String(sub.incident_date).slice(0, 7) : null;
  const { data: post, error } = await db.from("public_complaints").insert({ submission_id: sub.id, reference_code: sub.reference_code, category: sub.category, district: sub.district, incident_month: month, public_summary: summary, image_path: sub.image_path ?? null }).select("id").single();
  if (error || !post) redirect("/admin?error=publish");
  const { error: updateError } = await db.from("complaint_submissions").update({ status: "published", published_post_id: post.id, reviewed_at: new Date().toISOString() }).eq("id", id);
  if (updateError) redirect("/admin?error=publish");
  redirect("/admin");
}

// Edit the public, moderated copy only; private original submission stays unchanged.
export async function editPublicPost(formData: FormData) {
  await requireAdmin();
  const id = formString(formData, "post_id", 64);
  const summary = formString(formData, "public_summary", 2000);
  if (!validId(id)) redirect("/admin?error=invalid");
  if (summary.length < 30) redirect("/admin?error=summary");
  const { error } = await adminDb().from("public_complaints").update({ public_summary: summary, updated_at: new Date().toISOString() }).eq("id", id).is("deleted_at", null);
  if (error) redirect("/admin?error=edit");
  redirect("/admin?updated=1");
}

// Soft delete: hidden from public, recoverable from the recycle bin.
export async function movePostToTrash(formData: FormData) {
  await requireAdmin();
  const id = formString(formData, "post_id", 64);
  if (!validId(id)) redirect("/admin?error=invalid");
  const { error } = await adminDb().from("public_complaints").update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id).is("deleted_at", null);
  if (error) redirect("/admin?error=trash");
  redirect("/admin?trashed=1");
}

export async function restorePublicPost(formData: FormData) {
  await requireAdmin();
  const id = formString(formData, "post_id", 64);
  if (!validId(id)) redirect("/admin?error=invalid");
  const { error } = await adminDb().from("public_complaints").update({ deleted_at: null, updated_at: new Date().toISOString() }).eq("id", id).not("deleted_at", "is", null);
  if (error) redirect("/admin?error=restore");
  redirect("/admin?restored=1");
}

// Permanently delete only after the post is already in the recycle bin.
export async function permanentlyDeletePost(formData: FormData) {
  await requireAdmin();
  const id = formString(formData, "post_id", 64);
  if (!validId(id)) redirect("/admin?error=invalid");
  const db = adminDb();
  const { data: post, error: readError } = await db.from("public_complaints").select("id,submission_id").eq("id", id).not("deleted_at", "is", null).single();
  if (readError || !post) redirect("/admin?error=not-in-trash");
  const { error: deleteError } = await db.from("public_complaints").delete().eq("id", id).not("deleted_at", "is", null);
  if (deleteError) redirect("/admin?error=delete");
  // Keep the private report, but clear its pointer to the removed public copy.
  await db.from("complaint_submissions").update({ status: "rejected", published_post_id: null, reviewed_at: new Date().toISOString() }).eq("id", post.submission_id);
  redirect("/admin?deleted=1");
}
