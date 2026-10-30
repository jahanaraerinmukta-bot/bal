'use client';
import { useState } from 'react';

export default function ShareButtons({ postId, reference, summary, siteUrl }: { postId: string; reference: string; summary: string; siteUrl: string }) {
  const [copied, setCopied] = useState(false);
  const postUrl = `${siteUrl.replace(/\/$/, '')}/#post-${postId}`;
  const text = `জনতার কণ্ঠ — ${reference}: ${summary.slice(0, 180)}…`;
  async function copyLink() {
    const url = `${siteUrl.replace(/\/$/, '')}/#post-${postId}`;
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt('এই লিংকটি কপি করুন:', url);
    }
  }
  return <div className="share-row">
    <a className="share-link" href={`https://wa.me/?text=${encodeURIComponent(`${text} ${postUrl}`)}`} target="_blank" rel="noreferrer">WhatsApp-এ Share</a>
    <a className="share-link" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`} target="_blank" rel="noreferrer">Facebook-এ Share</a>
    <button className="share-link secondary" type="button" onClick={copyLink}>{copied ? 'লিংক কপি হয়েছে ✓' : 'Instagram / অন্যত্র শেয়ার'}</button>
  </div>;
}
