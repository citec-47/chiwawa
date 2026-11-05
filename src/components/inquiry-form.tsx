"use client";

import { FormEvent, useState } from "react";

type InquiryDog = { id: string; name: string; breedName: string };

export function InquiryForm({ dogs, dogId }: { dogs: InquiryDog[]; dogId?: string }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.get("name"),
          email: form.get("email"),
          phone: form.get("phone"),
          message: form.get("message"),
          dogId: form.get("dogId") || dogId || undefined
        })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Your message couldn't be sent.");
      formElement.reset();
      setError(false);
      setMessage("Thanks, your message has been sent.");
    } catch (reason) {
      setError(true);
      setMessage(reason instanceof Error ? reason.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return <form className="form-card" onSubmit={submit}>
    <div className="form-grid">
      <div className="field"><label htmlFor="inquiry-name">Your name</label><input id="inquiry-name" name="name" autoComplete="name" required maxLength={120} /></div>
      <div className="field"><label htmlFor="inquiry-email">Email address</label><input id="inquiry-email" name="email" type="email" autoComplete="email" required maxLength={254} /></div>
    </div>
    {dogs.length > 0 && <div className="field"><label htmlFor="inquiry-dog">I’m interested in</label><select id="inquiry-dog" name="dogId" defaultValue={dogId ?? ""}><option value="">A general question</option>{dogs.map((dog) => <option key={dog.id} value={dog.id}>{dog.name} — {dog.breedName}</option>)}</select></div>}
    <div className="field"><label htmlFor="inquiry-phone">Phone (optional)</label><input id="inquiry-phone" name="phone" type="tel" autoComplete="tel" maxLength={40} /></div>
    <div className="field"><label htmlFor="inquiry-message">Your message</label><textarea id="inquiry-message" name="message" required minLength={10} maxLength={3000} placeholder="What would you like to know?" /></div>
    <button className="button" type="submit" disabled={busy}>{busy ? "Sending…" : "Send message"} <span aria-hidden>→</span></button>
    <p className={`status-message${error ? " error" : ""}`} aria-live="polite">{message}</p>
    <p className="muted-note">This form is for messages only. It doesn’t reserve a dog.</p>
  </form>;
}
