"use client";

import { useCallback, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import { Loader2, RotateCw } from "lucide-react";
import { getCroppedImg } from "@/lib/crop-image";

interface AvatarCropModalProps {
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
  onClose: () => void;
}

export function AvatarCropModal({ imageSrc, onCropComplete, onClose }: AvatarCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{
    x: number; y: number; width: number; height: number;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const onCropChange = useCallback((c: { x: number; y: number }) => setCrop(c), []);
  const onZoomChange = useCallback((z: number) => setZoom(z), []);

  const onCropperCropComplete = useCallback(
    (_croppedArea: unknown, pixels: { x: number; y: number; width: number; height: number }) => {
      setCroppedAreaPixels(pixels);
    },
    []
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      setZoom((z) => Math.min(3, Math.max(1, z + (e.deltaY > 0 ? -0.05 : 0.05))));
    },
    []
  );

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setSaving(true);
    const blob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
    setSaving(false);
    if (blob) onCropComplete(blob);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[360px] overflow-hidden">
        {/* Crop area */}
        <div
          ref={containerRef}
          className="relative w-full aspect-square bg-zinc-900"
          onWheel={handleWheel}
        >
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            cropShape="round"
            showGrid={true}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropperCropComplete}
          />
        </div>

        {/* Bottom controls */}
        <div className="flex items-center justify-between px-5 py-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-800 transition-colors"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={() => setRotation((r) => r + 90)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 transition-colors"
            title="Putar"
          >
            <RotateCw className="h-4 w-4" />
          </button>

          <button
            onClick={handleSave}
            disabled={saving || !croppedAreaPixels}
            className="px-4 py-2 text-xs font-bold text-zinc-950 hover:text-black transition-colors disabled:opacity-40"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}
