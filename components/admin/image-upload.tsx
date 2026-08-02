"use client";

import { useEffect, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ImageUpload({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  // Revoke the blob URL once it's no longer needed, to avoid leaking memory.
  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLocalPreview(URL.createObjectURL(file));
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "car");

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      onChange(data.url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
      setLocalPreview(null);
    } finally {
      setUploading(false);
    }
  }

  const previewSrc = localPreview ?? value;

  return (
    <div className="space-y-2">
      {previewSrc && (
        <div className="relative aspect-video w-full max-w-xs overflow-hidden rounded-md border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element -- local blob previews aren't compatible with next/image's remote loader */}
          <img src={previewSrc} alt="Car" className="size-full object-cover" />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Loader2 className="size-6 animate-spin text-white" />
            </div>
          )}
        </div>
      )}
      <label>
        <Button type="button" variant="outline" size="sm" disabled={uploading} asChild>
          <span className="cursor-pointer">
            {uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            {uploading ? "Uploading..." : previewSrc ? "Replace image" : "Upload image"}
          </span>
        </Button>
        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </label>
    </div>
  );
}
