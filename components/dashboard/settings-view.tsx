"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, Mail, Shield, User as UserIcon, X } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AvatarCropDialog } from "@/components/dashboard/avatar-crop-dialog";
import { initials } from "@/lib/utils";

const ROLE_LABEL = { user: "User", admin: "Admin" } as const;

const tabTriggerClass =
  "gap-1.5 rounded-none border-b-2 border-transparent px-1 pb-3 text-muted-foreground data-[state=active]:border-accent data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none";

export function SettingsView({
  name,
  email,
  image,
  role,
}: {
  name: string;
  email: string;
  image?: string | null;
  role: "user" | "admin";
}) {
  const [avatarUrl, setAvatarUrl] = useState(image ?? undefined);
  const [pendingImageSrc, setPendingImageSrc] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [removingAvatar, setRemovingAvatar] = useState(false);
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

  async function handleRemoveAvatar() {
    setRemovingAvatar(true);
    const { error } = await authClient.updateUser({ image: null });
    setRemovingAvatar(false);
    if (error) {
      toast.error(error.message ?? "Could not remove photo.");
      return;
    }
    setAvatarUrl(undefined);
    toast.success("Profile photo removed.");
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
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Settings</h1>
      <div className="max-w-2xl">
        <Tabs defaultValue="profile">
          <TabsList className="h-auto w-full justify-start gap-6 rounded-none border-b border-border bg-transparent p-0">
            <TabsTrigger value="profile" className={tabTriggerClass}>
              <UserIcon className="size-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="email" className={tabTriggerClass}>
              <Mail className="size-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="security" className={tabTriggerClass}>
              <Shield className="size-4" />
              Security
            </TabsTrigger>
          </TabsList>

          <Card className="mt-6 transition-colors">
            <CardContent className="flex items-center gap-4">
              <Avatar className="size-14 shrink-0">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback className="bg-secondary text-base font-medium">
                  {initials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-semibold">{displayName}</p>
                  <Badge variant="secondary">{ROLE_LABEL[role]}</Badge>
                </div>
                <p className="truncate text-sm text-muted-foreground">{displayEmail}</p>
              </div>
            </CardContent>
          </Card>

          <TabsContent value="profile" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Edit profile</CardTitle>
                <CardDescription>Update your profile picture and name.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Avatar</Label>
                  <Avatar className="size-20">
                    <AvatarImage src={avatarUrl} alt={displayName} />
                    <AvatarFallback className="bg-secondary text-xl font-medium">
                      {initials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="size-4" />
                      Change photo
                    </Button>
                    {avatarUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={removingAvatar}
                        onClick={handleRemoveAvatar}
                        aria-label="Remove photo"
                      >
                        <X className="size-4" />
                      </Button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileSelected}
                    />
                  </div>
                </div>

                <form className="space-y-4" onSubmit={handleNameSubmit}>
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={savingName || displayName === name}>
                    {savingName ? "Saving..." : "Save changes"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Email address</CardTitle>
                <CardDescription>Update the email you use to sign in.</CardDescription>
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
                    {savingEmail ? "Saving..." : "Save changes"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>Change your password. You&apos;ll stay signed in here.</CardDescription>
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
                    {savingPassword ? "Updating..." : "Save changes"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <AvatarCropDialog
        imageSrc={pendingImageSrc}
        open={cropOpen}
        onOpenChange={setCropOpen}
        onSaved={handleAvatarSaved}
      />
    </div>
  );
}
