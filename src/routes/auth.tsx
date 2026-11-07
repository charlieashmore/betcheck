import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { COUNTRIES, INELIGIBLE_COUNTRIES } from "@/lib/config";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Stakewise" },
      { name: "description", content: "Sign in or create a Stakewise account. 18+ only." },
      { property: "og:title", content: "Sign in — Stakewise" },
      { property: "og:description", content: "Sign in or create a Stakewise account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (session) navigate({ to: "/check" });
  }, [session, navigate]);

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-semibold text-foreground">Your Stakewise account</h1>
      <Tabs defaultValue="signin" className="mt-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">Sign in</TabsTrigger>
          <TabsTrigger value="signup">Create account</TabsTrigger>
        </TabsList>
        <TabsContent value="signin"><SignIn /></TabsContent>
        <TabsContent value="signup"><SignUp /></TabsContent>
      </Tabs>
    </div>
  );
}

function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="mt-4 space-y-4 rounded-lg border border-border bg-card p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setBusy(false);
        if (error) toast.error(error.message);
      }}
    >
      <div className="space-y-2"><Label htmlFor="si-email">Email</Label><Input id="si-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div className="space-y-2"><Label htmlFor="si-pw">Password</Label><Input id="si-pw" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
      <Button type="submit" className="w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
    </form>
  );
}

function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("");
  const [adult, setAdult] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const ineligible = country !== "" && INELIGIBLE_COUNTRIES.includes(country);

  if (sent) {
    return (
      <div className="mt-4 rounded-lg border border-border bg-card p-6 text-sm text-foreground" role="status">
        <h2 className="font-semibold">Check your email</h2>
        <p className="mt-2 text-muted-foreground">We sent a confirmation link to {email}. Open it to finish creating your account.</p>
      </div>
    );
  }

  return (
    <form
      className="mt-4 space-y-4 rounded-lg border border-border bg-card p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!adult || !country || ineligible) return;
        setBusy(true);
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/check", data: { country, dob_confirmed: true } },
        });
        setBusy(false);
        if (error) toast.error(error.message.includes("Database error") ? "We couldn't create your account. Check your country and age confirmation." : error.message);
        else setSent(true);
      }}
    >
      <div className="space-y-2"><Label htmlFor="su-email">Email</Label><Input id="su-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div className="space-y-2"><Label htmlFor="su-pw">Password</Label><Input id="su-pw" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
      <div className="space-y-2">
        <Label htmlFor="su-country">Country of residence</Label>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger id="su-country"><SelectValue placeholder="Choose your country" /></SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {ineligible && (
          <p role="alert" className="rounded-md border border-block/30 bg-block-soft p-3 text-sm text-block">
            Stakewise isn't available in this country, so we can't create an account for you.
          </p>
        )}
      </div>
      <div className="flex items-start gap-3">
        <Checkbox id="su-adult" checked={adult} onCheckedChange={(v) => setAdult(v === true)} />
        <Label htmlFor="su-adult" className="text-sm font-normal leading-snug">I confirm I am 18 or over.</Label>
      </div>
      <Button type="submit" className="w-full" disabled={busy || !adult || !country || ineligible}>{busy ? "Creating…" : "Create account"}</Button>
    </form>
  );
}
