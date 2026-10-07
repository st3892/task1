"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/client";
import CherryTop from "./cherry-top";

export default function GenerationForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [cookingMessage, setCookingMessage] = useState("Cooking...");

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    let signedOut = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        signedOut = true;
        setAuthenticated(false);
        router.refresh();
      }
    });

    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (active && !signedOut) {
        setAuthenticated(!error && !!user);
      }
    }).catch(() => {
      if (active) setAuthenticated(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const prompt = String(formData.get("prompt") ?? "");

    setError(null);
    setSaved(false);

    if (!prompt.trim()) {
      setError("Please enter a prompt for your joke.");
      return;
    }

    setPending(true);
    const messages = ["Preheating the humor engine…", "Arguing with the oven…", "Adding unnecessary garnish…", "Checking if this joke is fully baked…"];
    setCookingMessage(Math.random() < 0.2 ? messages[Math.floor(Math.random() * messages.length)] : "Cooking...");
    try {
      const response = await fetch("/generations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const result = await response.json();
      if (response.status === 401) {
        setAuthenticated(false);
        router.refresh();
        return;
      }
      if (!response.ok) {
        setError(result.error || "Couldn’t cook up your joke. Please try again.");
        return;
      }

      form.reset();
      setSaved(true);
      router.refresh();
    } catch {
      setError("Couldn’t cook up your joke. Please check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  if (!authenticated) {
    return <p className="creation-sign-in"><Link href="/login">Sign in</Link> to cook up an AI creation.</p>;
  }

  return (
    <form className="card generation-form" onSubmit={handleSubmit} aria-labelledby="creation-form-heading" aria-busy={pending}>
      <CherryTop />
      <span className="eyebrow">YOUR DAILY DOSE OF SWEET NONSENSE</span>
      <h2 id="creation-form-heading">What are we cooking?</h2>
      <p className="field-help">One idea. A little wit. The cherry on top.</p>
      <fieldset disabled={pending}>
        <div className="form-field">
          <label htmlFor="creation-prompt">Your ingredient</label>
          <textarea id="creation-prompt" name="prompt" rows={3} maxLength={2000} placeholder="Add your ingredient… dorm life, a questionable date, the 1 train." required />
        </div>
        <button className="button cherry-action" type="submit"><span className="mini-cherry" aria-hidden="true" />{pending ? "Cooking..." : "Cook up a joke"}<span aria-hidden="true">↗</span></button>
      </fieldset>
      {error && <p role="alert">{error}</p>}
      {pending && <p className="cooking-status" role="status">{cookingMessage}</p>}
      {saved && <p role="status">Your creation is served!</p>}
    </form>
  );
}
