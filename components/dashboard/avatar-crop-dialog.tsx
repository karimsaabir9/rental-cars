"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Loader2, ZoomIn } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getCroppedImageBlob } from "@/lib/crop-image";

export function AvatarCropDialog({
  imageSrc,
  open,
  onOpenChange,
  onSaved,
}: {
  imageSrc: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (url: string) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    }
    onOpenChange(next);
  }

  async function handleSave() {
    if (!imageSrc || !croppedAreaPixels) return;

    setSaving(true);
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels);
      const formData = new FormData();
      formData.append("file", blob, "avatar.jpg");
      formData.append("type", "avatar");

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      onSaved(data.url);
      toast.success("Profile photo updated.");
      handleOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save photo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust your photo</DialogTitle>
          <DialogDescription>
            Drag to reposition and use the slider to zoom. Your photo saves only
            once you confirm.
          </DialogDescription>
        </DialogHeader>

        {imageSrc && (
          <div className="relative h-72 w-full overflow-hidden rounded-lg bg-muted">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
        )}

        <div className="flex items-center gap-3">
          <ZoomIn className="size-4 shrink-0 text-muted-foreground" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-accent"
            aria-label="Zoom"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !croppedAreaPixels}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            {saving ? "Saving..." : "Save photo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
