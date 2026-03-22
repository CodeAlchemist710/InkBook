"use client";

import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
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
import type { Studio } from "@/lib/types/database";

const settingsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  instagram_url: z
    .string()
    .url("Must be a valid URL")
    .or(z.literal(""))
    .optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  whatsapp_number: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export function SettingsForm({ studio }: { studio: Studio }) {
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormValues>({
    resolver: standardSchemaResolver(settingsSchema),
    defaultValues: {
      name: studio.name,
      description: studio.description ?? "",
      instagram_url: studio.instagram_url ?? "",
      address: studio.address ?? "",
      city: studio.city ?? "",
      phone: studio.phone ?? "",
      whatsapp_number: studio.whatsapp_number ?? "",
    },
  });

  async function onSubmit(data: SettingsFormValues) {
    const { error } = await supabase
      .from("studios")
      .update({
        name: data.name,
        description: data.description || null,
        instagram_url: data.instagram_url || null,
        address: data.address || null,
        city: data.city || null,
        phone: data.phone || null,
        whatsapp_number: data.whatsapp_number || null,
      })
      .eq("id", studio.id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Settings saved");
    router.refresh();
  }

  async function handleImageUpload(
    event: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "cover"
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    const extension = file.name.split(".").pop();
    const path = `${studio.id}/${type}-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("studio-assets")
      .upload(path, file);

    if (uploadError) {
      toast.error(uploadError.message);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("studio-assets").getPublicUrl(path);

    const updateField =
      type === "logo" ? { logo_url: publicUrl } : { cover_image_url: publicUrl };

    const { error: updateError } = await supabase
      .from("studios")
      .update(updateField)
      .eq("id", studio.id);

    if (updateError) {
      toast.error(updateError.message);
      return;
    }

    toast.success(`${type === "logo" ? "Logo" : "Cover image"} updated`);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Studio name</Label>
              <Input id="name" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register("description")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram_url">Instagram URL</Label>
              <Input
                id="instagram_url"
                placeholder="https://instagram.com/yourstudio"
                {...register("instagram_url")}
              />
              {errors.instagram_url && (
                <p className="text-sm text-destructive">
                  {errors.instagram_url.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" {...register("address")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" {...register("city")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register("phone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp_number">WhatsApp number</Label>
              <Input
                id="whatsapp_number"
                {...register("whatsapp_number")}
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save changes"}
        </Button>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Media</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Logo</Label>
            {studio.logo_url && (
              <div className="relative h-20 w-20 overflow-hidden rounded-lg">
                <Image
                  src={studio.logo_url}
                  alt="Studio logo"
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, "logo")}
            />
          </div>
          <div className="space-y-2">
            <Label>Cover image</Label>
            {studio.cover_image_url && (
              <div className="relative h-40 w-full overflow-hidden rounded-lg">
                <Image
                  src={studio.cover_image_url}
                  alt="Cover image"
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, "cover")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your public URL</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            /{studio.slug}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
