"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Camera } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AvatarCropDialog } from "@/components/dashboard/avatar-crop-dialog";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ProfileForm({
  name,
  email,
  image,
}: {
  name: string;
  email: string;
  image?: string | null;
}) {
  const [avatarUrl, setAvatarUrl] = useState(image ?? undefined);
  const [pendingImageSrc, setPendingImageSrc] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(name);
  const [savingName, setSavingName] = useState(false);

  const [displayEmail, setDisplayEmail] = useState(email);
  const [savingEmail, setSavingEmail] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingImageSrc(URL.createObjectURL(file));
    setCropOpen(true);
    e.target.value = "";
  }

  async function handleAvatarSaved(url: string) {
    setAvatarUrl(url);
    const { error } = await authClient.updateUser({ image: url });
    if (error) {
      toast.error(error.message ?? "Photo uploaded, but couldn't be saved to your profile.");
    }
  }

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSavingName(true);
    const { error } = await authClient.updateUser({ name: displayName });
    setSavingName(false);
    if (error) {
      toast.error(error.message ?? "Could not update profile.");
      return;
    }
    toast.success("Profile updated.");
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (displayEmail === email) return;
    setSavingEmail(true);
    const { error } = await authClient.changeEmail({ newEmail: displayEmail });
    setSavingEmail(false);
    if (error) {
      toast.error(error.message ?? "Could not update email.");
      return;
    }
    toast.success("Email updated.");
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSavingPassword(true);
    const { error } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    });
    setSavingPassword(false);
    if (error) {
      toast.error(error.message ?? "Could not change password.");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    toast.success("Password changed.");
  }

  return (
    <div className="max-w-md space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Photo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="bg-secondary text-lg">
                {initials(displayName)}
              </AvatarFallback>
            </Avatar>
            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Camera className="size-4" />
              Change photo
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelected}
            />
          </div>
        </CardContent>
      </Card>

      <AvatarCropDialog
        imageSrc={pendingImageSrc}
        open={cropOpen}
        onOpenChange={setCropOpen}
        onSaved={handleAvatarSaved}
      />

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Name</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleNameSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <Button type="submit" disabled={savingName || displayName === name}>
              {savingName ? "Saving..." : "Save name"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Email</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleEmailSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={displayEmail}
                onChange={(e) => setDisplayEmail(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={savingEmail || displayEmail === email}>
              {savingEmail ? "Saving..." : "Save email"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handlePasswordSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Current password</Label>
              <PasswordInput
                id="currentPassword"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New password</Label>
              <PasswordInput
                id="newPassword"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <Button type="submit" disabled={savingPassword}>
              {savingPassword ? "Updating..." : "Update password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
