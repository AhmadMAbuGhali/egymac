import { useRef, useState, useCallback } from "react";

/**
 * Premium magnifying hover — transform-origin tracks cursor for machinery close-ups.
 */
export default function MagnifyImage({ src, alt, className = "" }) {
  const containerRef = useRef(null);
  const [active, setActive] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");

  const handleMove = useCallback((e) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${x}% ${y}%`);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`magnify-image ${active ? "magnify-image--active" : ""} ${className}`}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onMouseMove={handleMove}
    >
      <img
        src={src}
        alt={alt}
        className="magnify-image__img"
        style={{ transformOrigin: origin }}
        draggable={false}
      />
    </div>
  );
}
