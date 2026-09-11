"use client";

import { useClerk, useSignIn, useSignUp } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function SsoCallbackPage() {
  const clerk = useClerk();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const router = useRouter();
  const hasRun = useRef(false);

  useEffect(() => {
    if (!clerk.loaded || hasRun.current) return;
    hasRun.current = true;

    async function completeOAuth() {
      if (signIn.status === "complete") {
        await finalize(signIn);
        return;
      }

      if (signUp.status === "complete") {
        await finalize(signUp);
        return;
      }

      if (signIn.isTransferable) {
        await signUp.create({ transfer: true });
        const signUpStatus = signUp.status as typeof signUp.status | "complete";
        if (signUpStatus === "complete") await finalize(signUp);
        else router.push("/sign-in");
        return;
      }

      if (signUp.isTransferable) {
        await signIn.create({ transfer: true });
        const signInStatus = signIn.status as typeof signIn.status | "complete";
        if (signInStatus === "complete") await finalize(signIn);
        else router.push("/sign-in");
        return;
      }

      router.push("/sign-in");
    }

    async function finalize(resource: typeof signIn | typeof signUp) {
      await resource.finalize({
        navigate: ({ decorateUrl }) => {
          const destination = decorateUrl("/app/overview");
          if (destination.startsWith("http")) window.location.href = destination;
          else router.push(destination);
        },
      });
    }

    void completeOAuth();
  }, [clerk.loaded, router, signIn, signUp]);

  return <main className="flex min-h-dvh items-center justify-center bg-background text-secondary"><div id="clerk-captcha" /><p>Connecting to SignalFlow...</p></main>;
}