import React, { useEffect, useMemo, useState } from "react";
import { Text, TextStyle } from "react-native";

type Props = {
  phrases: string[];
  typingSpeedMs?: number;
  deletingSpeedMs?: number;
  holdMs?: number;
  style?: TextStyle;
};

export default function TypewriterPlaceholder({
  phrases,
  typingSpeedMs = 55,
  deletingSpeedMs = 30,
  holdMs = 1200,
  style,
}: Props) {
  const safePhrases = useMemo(
    () => (phrases.length ? phrases : ["explore services"]),
    [phrases],
  );
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [value, setValue] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = safePhrases[phraseIndex % safePhrases.length];
    const doneTyping = value === current;
    const doneDeleting = value.length === 0;

    let timeout = typingSpeedMs;

    if (!isDeleting && doneTyping) {
      timeout = holdMs;
    } else if (isDeleting) {
      timeout = deletingSpeedMs;
    }

    const id = setTimeout(() => {
      if (!isDeleting) {
        if (doneTyping) {
          setIsDeleting(true);
        } else {
          setValue(current.slice(0, value.length + 1));
        }
      } else if (doneDeleting) {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % safePhrases.length);
      } else {
        setValue(current.slice(0, value.length - 1));
      }
    }, timeout);

    return () => clearTimeout(id);
  }, [
    deletingSpeedMs,
    holdMs,
    isDeleting,
    phraseIndex,
    safePhrases,
    typingSpeedMs,
    value,
  ]);

  return <Text style={style}>{value}</Text>;
}
