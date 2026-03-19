import React from "react";

export default function HtmlFrame({ src, title }) {
  return (
    <div className="w-full h-screen">
      <iframe
        src={src}
        title={title || "Embedded page"}
        className="w-full h-full border-0"
      />
    </div>
  );
}
