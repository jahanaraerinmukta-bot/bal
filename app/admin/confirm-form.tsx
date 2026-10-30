"use client";
import type { FormEvent } from "react";

type Props = { action: (formData: FormData) => void | Promise<void>; id: string; label: string; confirmText: string; buttonClass?: string };
export default function ConfirmForm({ action, id, label, confirmText, buttonClass = "secondary" }: Props) {
  function confirm(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm(confirmText)) event.preventDefault();
  }
  return <form action={action} onSubmit={confirm} style={{ marginTop: 12 }}>
    <input type="hidden" name="post_id" value={id} />
    <button className={buttonClass} type="submit">{label}</button>
  </form>;
}
