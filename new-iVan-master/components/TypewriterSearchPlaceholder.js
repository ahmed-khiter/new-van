"use client";

import { useEffect, useState } from "react";

export default function TypewriterSearchPlaceholder({
  phrases = [],
  isVisible = true,
  className = "",
  startDelay = 900,
}) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (!isVisible || phrases.length === 0) {
      setText("");
      return;
    }

    let phraseIndex = 0;
    let charIndex = 0;
    let deleting = false;
    let timer;

    const tick = () => {
      const phrase = phrases[phraseIndex] || "";

      if (!deleting) {
        charIndex += 1;
        setText(phrase.slice(0, charIndex));

        if (charIndex >= phrase.length) {
          deleting = true;
          timer = setTimeout(tick, 1600);
        } else {
          timer = setTimeout(tick, 75 + Math.random() * 45);
        }
      } else {
        charIndex -= 1;
        setText(phrase.slice(0, Math.max(charIndex, 0)));

        if (charIndex <= 0) {
          deleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
          timer = setTimeout(tick, 350);
        } else {
          timer = setTimeout(tick, 35);
        }
      }
    };

    timer = setTimeout(tick, startDelay);
    return () => clearTimeout(timer);
  }, [isVisible, phrases, startDelay]);

  if (!isVisible) {
    return null;
  }

  return (
    <span className={className}>
      {text || "\u00A0"}
      <span className="hero-search-cursor" />
    </span>
  );
}
