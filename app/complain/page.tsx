import ComplaintForm from "./form";
export default function ComplainPage() {
  return <main className="wrap">
    <div className="hero"><h1>বেনামি অভিযোগ জমা দিন</h1><p>প্রয়োজনীয় তথ্য দিন, পরিচয় প্রকাশকারী তথ্য এড়িয়ে চলুন।</p></div>
    <div className="notice">এই ফর্মে নাম/ফোন/ইমেইল চাওয়া হয় না। তবুও নেটওয়ার্ক বা hosting log থেকে কিছু প্রযুক্তিগত তথ্য থাকতে পারে—তাই একে শতভাগ অশনাক্তযোগ্য ভাববেন না। ছবি/ফাইল আপলোড এখন বন্ধ।</div>
    <ComplaintForm />
  </main>;
}
