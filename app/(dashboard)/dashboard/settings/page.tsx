import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/shared/settings-form";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: studio } = await supabase
    .from("studios")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  if (!studio) redirect("/login");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <SettingsForm studio={studio} />
    </div>
  );
}
