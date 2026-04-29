"use client";

const TICKER_ITEMS = [
  "fastest delivery",
  "free delivery",
  "verified vendors",
  "live tracking",
  "24/7 deliveries",
  "hassle-free returns",
];

export default function DeliveryInfoBanner({ deliveryTimeMinutes = null }) {
  const formattedTime = Number.isFinite(Number(deliveryTimeMinutes))
    ? Math.max(1, Math.round(Number(deliveryTimeMinutes)))
    : null;

  const items = formattedTime
    ? [`est. ${formattedTime} min delivery`, ...TICKER_ITEMS]
    : TICKER_ITEMS;

  // Double for seamless loop
  const looped = [...items, ...items];

  return (
    <div className="overflow-hidden py-1">
      <div
        className="flex animate-marquee whitespace-nowrap"
        style={{ animationDuration: `${items.length * 4}s` }}
      >
        {looped.map((text, idx) => (
          <span
            key={idx}
            className="inline-flex shrink-0 items-center text-[11px] font-black italic uppercase tracking-wider text-[#1a1a2e]/60"
          >
            {text}
            <span className="mx-3 text-[#1a1a2e]/25 not-italic font-light">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
