"use client";

export default function ProductStage({
  images, alt, colorKey,
}: {
  images: string[];
  alt: string;
  colorKey: string;
}) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-[28px] border border-white/8 bg-[#101010]">
      <div className="absolute inset-0 bg-[#141d2b]" />
      <img
        key={colorKey}
        src={images[0]}
        alt={alt}
        className="relative h-full w-full object-contain p-8 drop-shadow-[0_30px_40px_rgba(0,0,0,.55)]"
        draggable={false}
      />
    </div>
  );
}
