"use client";

import { QRCodeSVG } from "qrcode.react";

export default function QRCode({
  value,
  size = 200,
  level = "M",
}: {
  value: string;
  size?: number;
  level?: "L" | "M" | "Q" | "H";
}) {
  return (
    <div className="inline-flex items-center justify-center rounded-card border border-ink/10 bg-white p-4">
      <QRCodeSVG value={value} size={size} level={level} />
    </div>
  );
}
