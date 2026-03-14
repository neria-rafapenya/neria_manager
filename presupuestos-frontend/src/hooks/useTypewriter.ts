import { useEffect, useState } from "react";

export function useTypewriter(text: string, speed: number = 15, resetKey?: string | number) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let index = 0;

    setDisplayedText("");
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, index + 1));
      index++;

      if (index >= text.length) {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, resetKey]);

  return displayedText;
}
