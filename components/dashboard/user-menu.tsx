"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, LogOut, Settings } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { cn, initials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu({
  name,
  email,
  image,
  role,
  settingsHref,
  variant = "full",
  align = "start",
  className,
}: {
  name: string;
  email: string;
  image?: string | null;
  role: "user" | "admin";
  settingsHref: string;
  variant?: "full" | "compact";
  align?: "start" | "end";
  className?: string;
}) {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "full" ? (
          <button
            type="button"
            className={cn(
              "flex w-full items-center gap-2.5 rounded-md p-1.5 text-left outline-none transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring/50",
              className,
            )}
          >
            <Avatar className="size-8 shrink-0">
              <AvatarImage src={image ?? undefined} alt={name} />
              <AvatarFallback className="bg-secondary text-xs font-medium">
                {initials(name)}
              </AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{name}</span>
              <span className="block truncate text-xs text-muted-foreground">{email}</span>
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
          </button>
        ) : (
          <button
            type="button"
            className={cn(
              "rounded-full outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring/50",
              className,
            )}
            aria-label="Account menu"
          >
            <Avatar className="size-8">
              <AvatarImage src={image ?? undefined} alt={name} />
              <AvatarFallback className="bg-secondary text-xs font-medium">
                {initials(name)}
              </AvatarFallback>
            </Avatar>
          </button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align={align} sideOffset={8} className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-2.5 py-1">
            <Avatar className="size-9 shrink-0">
              <AvatarImage src={image ?? undefined} alt={name} />
              <AvatarFallback className="bg-secondary text-xs font-medium">
                {initials(name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-medium text-foreground">{name}</p>
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px] uppercase">
                  {role}
                </Badge>
              </div>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href={settingsHref} className="cursor-pointer">
            <Settings className="size-4" />
            Settings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem variant="destructive" onClick={handleSignOut} className="cursor-pointer">
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
