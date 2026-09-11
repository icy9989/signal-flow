"use client";

import { useState } from "react";
import { useSignIn, useSignUp } from "@clerk/nextjs";
import type { OAuthStrategy } from "@clerk/nextjs/types";
import { Activity, ArrowUpRight, Check, ChevronLeft, LoaderCircle, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type AuthMode = "sign-in" | "sign-up";

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-2 text-xs text-red-300">{message}</p> : null;
}

export function AuthScreen({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const { signIn, errors: signInErrors, fetchStatus: signInFetchStatus } = useSignIn();
  const { signUp, errors: signUpErrors, fetchStatus: signUpFetchStatus } = useSignUp();
  const [isVerifying, setIsVerifying] = useState(false);
  const [message, setMessage] = useState("");
  const isSignUp = mode === "sign-up";
  const isLoading = signInFetchStatus === "fetching" || signUpFetchStatus === "fetching";
  const errors = isSignUp ? signUpErrors : signInErrors;

  async function finishAuthentication(resource: { finalize: (options: { navigate: ({ decorateUrl }: { decorateUrl: (path: string) => string }) => void }) => Promise<unknown> }) {
    await resource.finalize({
      navigate: ({ decorateUrl }) => {
        const destination = decorateUrl("/app/overview");
        if (destination.startsWith("http")) {
          window.location.href = destination;
        } else {
          router.push(destination);
        }
      },
    });
  }

  async function handleSignIn(formData: FormData) {
    setMessage("");
    const identifier = String(formData.get("identifier") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      const result = await signIn.password({ identifier, password });
      if (result.error) {
        setMessage(getErrorMessage(result.error));
      } else if (signIn.status === "complete") {
        await finishAuthentication(signIn);
      } else if (signIn.status === "needs_second_factor") {
        setMessage("Your account needs a second verification step. Use the verification option configured for your account.");
      }
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  async function handleSignUp(formData: FormData) {
    setMessage("");
    const emailAddress = String(formData.get("emailAddress") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      const result = await signUp.password({ emailAddress, password });
      if (result.error) {
        setMessage(getErrorMessage(result.error));
      } else if (signUp.status === "complete") {
        await finishAuthentication(signUp);
      } else {
        await signUp.verifications.sendEmailCode();
        setIsVerifying(true);
      }
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  async function handleOAuth(strategy: OAuthStrategy) {
    setMessage("");

    try {
      const result = await (isSignUp ? signUp : signIn).sso({
        strategy,
        redirectUrl: "/app/overview",
        redirectCallbackUrl: "/sso-callback",
      });

      if (result.error) {
        setMessage(getErrorMessage(result.error));
      }
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  async function handleVerification(formData: FormData) {
    setMessage("");
    const code = String(formData.get("code") ?? "");

    try {
      const result = await signUp.verifications.verifyEmailCode({ code });
      if (result.error) {
        setMessage(getErrorMessage(result.error));
      } else if (signUp.status === "complete") {
        await finishAuthentication(signUp);
      }
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  const globalError = errors?.global?.[0]?.message;
  const identifierError = !isSignUp ? signInErrors?.fields?.identifier?.message : undefined;
  const emailError = isSignUp ? signUpErrors?.fields?.emailAddress?.message : undefined;
  const passwordError = errors?.fields?.password?.message;
  const codeError = signUpErrors?.fields?.code?.message;

  return (
    <main className="grid min-h-dvh bg-background text-foreground lg:grid-cols-[minmax(0,1.1fr)_minmax(420px,0.9fr)]">
      <section className="relative hidden overflow-hidden border-r border-border bg-sidebar px-10 py-10 lg:flex lg:flex-col lg:justify-between xl:px-16">
        <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(34,197,94,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.06)_1px,transparent_1px)] [background-size:64px_64px]" />
        <div className="absolute -bottom-32 -left-32 size-[480px] rounded-full border border-primary-border bg-primary-soft blur-3xl" />
        <Link href="/" className="relative flex items-center gap-2.5 text-lg font-semibold tracking-tight">
          <Activity aria-hidden="true" className="size-6 text-primary" />
          SignalFlow
        </Link>
        <div className="relative max-w-xl pb-8">
          <p className="mb-5 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.24em] text-primary"><Sparkles className="size-3.5" /> Feedback intelligence</p>
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-[-0.04em] text-foreground xl:text-6xl">Turn customer noise into your next clear move.</h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-secondary">Bring every customer signal into one focused workspace. Find the themes worth acting on, backed by the evidence your team needs.</p>
          <div className="mt-10 grid max-w-lg grid-cols-2 gap-3">
            <div className="border-l-2 border-primary px-4 py-1"><p className="text-sm font-medium">Organize feedback</p><p className="mt-1 text-xs text-muted">Across every channel</p></div>
            <div className="border-l-2 border-cyan-400 px-4 py-1"><p className="text-sm font-medium">See what matters</p><p className="mt-1 text-xs text-muted">Before it becomes noise</p></div>
          </div>
        </div>
        <p className="relative text-xs text-muted">A calmer way to make product decisions.</p>
      </section>

      <section className="flex min-h-dvh flex-col justify-center px-6 py-10 sm:px-12 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          <Link href="/" className="mb-14 flex items-center gap-2.5 text-lg font-semibold tracking-tight lg:hidden"><Activity aria-hidden="true" className="size-6 text-primary" />SignalFlow</Link>
          {isVerifying ? (
            <VerificationForm onSubmit={handleVerification} onBack={() => { setIsVerifying(false); setMessage(""); }} isLoading={isLoading} error={codeError} message={message} />
          ) : (
            <>
              <div className="mb-9">
                <p className="mb-3 text-sm font-medium text-primary">{isSignUp ? "Start with a clearer signal" : "Welcome back"}</p>
                <h2 className="text-3xl font-semibold tracking-[-0.035em]">{isSignUp ? "Create your workspace" : "Sign in to SignalFlow"}</h2>
                <p className="mt-3 text-sm leading-6 text-secondary">{isSignUp ? "Set up your private feedback intelligence workspace." : "Your customer signals are waiting."}</p>
              </div>
              <form action={isSignUp ? handleSignUp : handleSignIn} className="space-y-5">
                <div>
                  <label htmlFor={isSignUp ? "emailAddress" : "identifier"} className="mb-2 block text-sm font-medium">Email address</label>
                  <input id={isSignUp ? "emailAddress" : "identifier"} name={isSignUp ? "emailAddress" : "identifier"} type="email" autoComplete="email" required className="h-12 w-full rounded-md border border-border-strong bg-surface px-4 text-sm outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="you@company.com" />
                  <FieldError message={emailError ?? identifierError} />
                </div>
                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-medium">Password</label>
                  <input id="password" name="password" type="password" autoComplete={isSignUp ? "new-password" : "current-password"} required minLength={8} className="h-12 w-full rounded-md border border-border-strong bg-surface px-4 text-sm outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="Enter your password" />
                  <FieldError message={passwordError} />
                </div>
                {isSignUp && <div id="clerk-captcha" className="min-h-0" aria-hidden="true" />}
                {(message || globalError) && <p role="alert" className="border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-200">{message || globalError}</p>}
                <button type="submit" disabled={isLoading} className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-60">{isLoading && <LoaderCircle className="size-4 animate-spin" />}{isSignUp ? "Create workspace" : "Continue to SignalFlow"}<ArrowUpRight className="size-4" /></button>
              </form>
              <div className="my-8 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-border" />or continue with<span className="h-px flex-1 bg-border" /></div>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => handleOAuth("oauth_google")} disabled={isLoading} className="flex h-11 items-center justify-center gap-2 rounded-md border border-border-strong bg-surface px-3 text-sm font-medium transition-colors hover:border-primary-border hover:bg-hover disabled:pointer-events-none disabled:opacity-60"><GoogleIcon />Google</button>
                <button type="button" onClick={() => handleOAuth("oauth_github")} disabled={isLoading} className="flex h-11 items-center justify-center gap-2 rounded-md border border-border-strong bg-surface px-3 text-sm font-medium transition-colors hover:border-primary-border hover:bg-hover disabled:pointer-events-none disabled:opacity-60"><GithubIcon />GitHub</button>
              </div>
              <div className="my-8 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-border" />Secure access<span className="h-px flex-1 bg-border" /></div>
              <div className="flex items-center justify-center gap-2 text-xs text-muted"><ShieldCheck className="size-4 text-primary" />Protected by secure account sessions</div>
              <p className="mt-8 text-center text-sm text-secondary">{isSignUp ? "Already have an account?" : "New to SignalFlow?"}{" "}<Link href={isSignUp ? "/sign-in" : "/sign-up"} className="font-medium text-primary hover:text-primary-hover">{isSignUp ? "Sign in" : "Create an account"}</Link></p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function GoogleIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4"><path fill="#4285F4" d="M21.35 12.23c0-.72-.06-1.42-.18-2.09H12v3.96h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.91-4.2 2.91-7.26Z" /><path fill="#34A853" d="M12 21.6c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.7-1.72-5.47-4.03H3.28v2.53A9.74 9.74 0 0 0 12 21.6Z" /><path fill="#FBBC05" d="M6.53 13.68a5.86 5.86 0 0 1 0-3.36V7.79H3.28a9.75 9.75 0 0 0 0 8.42l3.25-2.53Z" /><path fill="#EA4335" d="M12 6.29c1.43 0 2.72.49 3.73 1.45l2.8-2.8C16.84 3.35 14.63 2.4 12 2.4a9.74 9.74 0 0 0-8.72 5.39l3.25 2.53C7.3 8.01 9.46 6.29 12 6.29Z" /></svg>;
}

function GithubIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 fill-current"><path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.04c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.74.08-.74 1.2.08 1.83 1.23 1.83 1.23 1.07 1.83 2.8 1.3 3.48.99.11-.77.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.38 1.23-3.22-.12-.3-.53-1.52.12-3.17 0 0 1-.32 3.3 1.23a11.47 11.47 0 0 1 6 0c2.29-1.55 3.29-1.23 3.29-1.23.66 1.65.25 2.87.13 3.17.76.84 1.22 1.91 1.22 3.22 0 4.62-2.8 5.64-5.48 5.94.43.37.82 1.1.82 2.22v3.29c0 .32.22.69.83.57A12 12 0 0 0 12 .5Z" /></svg>;
}

function VerificationForm({ onSubmit, onBack, isLoading, error, message }: { onSubmit: (data: FormData) => Promise<void>; onBack: () => void; isLoading: boolean; error?: string; message: string }) {
  return <>
    <button type="button" onClick={onBack} className="mb-10 flex items-center gap-2 text-sm text-secondary hover:text-foreground"><ChevronLeft className="size-4" />Use a different email</button>
    <div className="mb-9"><div className="mb-4 flex size-11 items-center justify-center rounded-full bg-primary-soft text-primary"><Check className="size-5" /></div><h2 className="text-3xl font-semibold tracking-[-0.035em]">Check your inbox</h2><p className="mt-3 text-sm leading-6 text-secondary">We sent a verification code to your email. Enter it below to finish creating your SignalFlow workspace.</p></div>
    <form action={onSubmit} className="space-y-5"><div><label htmlFor="code" className="mb-2 block text-sm font-medium">Verification code</label><input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" required className="h-12 w-full rounded-md border border-border-strong bg-surface px-4 text-center text-lg tracking-[0.3em] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="000000" /> <FieldError message={error} /></div>{message && <p role="alert" className="border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-200">{message}</p>}<button type="submit" disabled={isLoading} className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-60">{isLoading && <LoaderCircle className="size-4 animate-spin" />}Verify email<ArrowUpRight className="size-4" /></button></form>
  </>;
}