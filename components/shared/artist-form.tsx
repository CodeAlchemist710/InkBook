"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import slugify from "slugify";
import { createClient } from "@/lib/supabase/client";
import { TATTOO_STYLES } from "@/lib/constants";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User } from "lucide-react";
import type { Artist } from "@/lib/types/database";
import Link from "next/link";

const artistSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  bio: z.string().optional(),
  whatsapp_number: z.string().optional(),
  instagram_url: z.string().optional(),
});

type ArtistFormValues = z.infer<typeof artistSchema>;

export function ArtistForm({
  studioId,
  artist,
}: {
  studioId: string;
  artist?: Artist;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [selectedStyles, setSelectedStyles] = useState<string[]>(
    (artist?.specialties as string[]) ?? []
  );
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    artist?.avatar_url ?? null
  );
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ArtistFormValues>({
    resolver: standardSchemaResolver(artistSchema),
    defaultValues: {
      name: artist?.name ?? "",
      bio: artist?.bio ?? "",
      whatsapp_number: artist?.whatsapp_number ?? "",
      instagram_url: artist?.instagram_url ?? "",
    },
  });

  function toggleStyle(style: string) {
    setSelectedStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const ext = file.name.split(".").pop();
    const uid = crypto.randomUUID();
    const path = `${studioId}/avatars/${uid}.${ext}`;

    const { error } = await supabase.storage
      .from("portfolio")
      .upload(path, file);

    if (error) {
      toast.error(error.message);
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("portfolio").getPublicUrl(path);

    setAvatarUrl(publicUrl);
    setUploading(false);
  }

  async function generateUniqueSlug(name: string): Promise<string> {
    const slug = slugify(name, { lower: true, strict: true });

    const { data: existing } = await supabase
      .from("artists")
      .select("slug")
      .eq("studio_id", studioId)
      .like("slug", `${slug}%`);

    if (!existing || existing.length === 0) return slug;

    const existingSlugs = new Set(existing.map((a) => a.slug));
    if (!existingSlugs.has(slug)) return slug;

    let counter = 1;
    while (existingSlugs.has(`${slug}-${counter}`)) {
      counter++;
    }
    return `${slug}-${counter}`;
  }

  async function onSubmit(data: ArtistFormValues) {
    if (artist) {
      // Update existing artist
      const res = await fetch(`/api/artists/${artist.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          bio: data.bio || null,
          whatsapp_number: data.whatsapp_number || null,
          instagram_url: data.instagram_url || null,
          specialties: selectedStyles,
          avatar_url: avatarUrl,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to update artist");
        return;
      }

      toast.success("Artist updated");
      router.refresh();
    } else {
      // Create new artist
      const slug = await generateUniqueSlug(data.name);

      const res = await fetch("/api/artists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          slug,
          bio: data.bio || null,
          whatsapp_number: data.whatsapp_number || null,
          instagram_url: data.instagram_url || null,
          specialties: selectedStyles,
          avatar_url: avatarUrl,
          studio_id: studioId,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to create artist");
        return;
      }

      toast.success("Artist created");
      router.push("/dashboard/artists");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/artists">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">
          {artist ? "Edit Artist" : "Add Artist"}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" {...register("bio")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp_number">WhatsApp number</Label>
              <Input id="whatsapp_number" {...register("whatsapp_number")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram_url">Instagram URL</Label>
              <Input id="instagram_url" {...register("instagram_url")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Avatar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative h-20 w-20 overflow-hidden rounded-full bg-muted">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Avatar"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <Input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              disabled={uploading}
            />
            {uploading && (
              <p className="text-sm text-muted-foreground">Uploading...</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Specialties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {TATTOO_STYLES.map((style) => (
                <Badge
                  key={style}
                  variant={
                    selectedStyles.includes(style) ? "default" : "outline"
                  }
                  className="cursor-pointer"
                  onClick={() => toggleStyle(style)}
                >
                  {style}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={isSubmitting || uploading}>
          {isSubmitting
            ? artist
              ? "Saving..."
              : "Creating..."
            : artist
              ? "Save changes"
              : "Create artist"}
        </Button>
      </form>
    </div>
  );
}
