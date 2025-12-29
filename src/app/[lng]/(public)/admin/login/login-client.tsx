"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { toast } from "sonner";

import type { Language } from "@/i18n/settings";
import { useTranslation } from "@/i18n/client";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";

export function AdminLoginClient({
                                   lng,
                                   next,
                                   error,
                                 }: {
  lng: Language;
  next: string;
  error?: "unauthorized" | "forbidden";
}) {
  const { t } = useTranslation({ lng, ns: "auth" });
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!error) return;
    toast.error(t(`errors.${error}` as any));
  }, [error, t]);

  async function onGoogle() {
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();

      const cred = await signInWithPopup(auth, provider);
      const idToken = await cred.user.getIdToken(true);

      const res = await signIn("firebase", {
        idToken,
        redirect: false,
      });

      if (res?.error) {
        toast.error(res.error);
        return;
      }

      toast.success("OK");
      router.push(next);
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pt-2">
      <Button onClick={onGoogle} disabled={loading} className="w-full">
        {loading ? "..." : t("adminLogin.continueWithGoogle")}
      </Button>
    </div>
  );
}