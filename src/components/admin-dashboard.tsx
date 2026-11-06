"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Breed = { id: string; name: string; slug: string; description: string; imageUrl: string };
type Dog = { id: string; name: string; breedId: string; breedName: string; description: string; priceCents: number; imageUrl: string; status: "draft" | "published" };
type InquiryDog = { id: string; name: string; breedName: string; imageUrl: string };
type Inquiry = { id: string; customerName: string; email: string; phone: string | null; message: string; dogId: string | null; dogName: string | null; dogs: InquiryDog[]; status: "new" | "in_progress" | "closed"; createdAt: string };
type Tab = "dogs" | "breeds" | "inquiries";

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(url, { ...init, headers });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Request failed.");
  return body as T;
}

async function uploadPetImage(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 6 * 1024 * 1024) {
    throw new Error("Choose a JPG, PNG, or WebP image smaller than 6 MB.");
  }
  const signature = await requestJson<{ cloudName: string; apiKey: string; timestamp: number; folder: string; signature: string }>("/api/admin/cloudinary-signature", { method: "POST", body: "{}" });
  const data = new FormData();
  data.append("file", file);
  data.append("api_key", signature.apiKey);
  data.append("timestamp", String(signature.timestamp));
  data.append("folder", signature.folder);
  data.append("signature", signature.signature);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(signature.cloudName)}/image/upload`, { method: "POST", body: data });
  const result = await response.json();
  if (!response.ok || typeof result.secure_url !== "string") throw new Error("Image upload failed. Check Cloudinary configuration.");
  return result.secure_url;
}

export function AdminDashboard({ email }: { email: string }) {
  const [tab, setTab] = useState<Tab>("dogs");
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [breedRows, dogRows, inquiryRows] = await Promise.all([
        requestJson<Breed[]>("/api/admin/breeds"),
        requestJson<Dog[]>("/api/admin/dogs"),
        requestJson<Inquiry[]>("/api/admin/inquiries")
      ]);
      setBreeds(breedRows);
      setDogs(dogRows);
      setInquiries(inquiryRows);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load admin data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  function reportError(reason: unknown) {
    setError(reason instanceof Error ? reason.message : "The action could not be completed.");
    setNotice("");
  }

  async function remove(url: string, noun: string) {
    if (!window.confirm(`Delete this ${noun}? This cannot be undone.`)) return;
    try {
      await requestJson(url, { method: "DELETE" });
      setNotice(`${noun[0].toUpperCase()}${noun.slice(1)} deleted.`);
      await load();
    } catch (reason) { reportError(reason); }
  }

  return <main className="admin-page"><div className="admin-shell">
    <header className="admin-header">
      <div><Link className="brand" href="/"><span className="brand-mark">✿</span> Little Paws <span className="muted-note">/ Admin</span></Link><h1 className="admin-title" style={{ marginTop: 24 }}>Your studio</h1><p className="admin-subtitle">Signed in as {email}</p></div>
      <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}><Link className="button button-outline" href="/">View website</Link><button className="button" onClick={logout}>Sign out</button></div>
    </header>
    <div className="admin-tabs" role="tablist" aria-label="Manage content">
      {(["dogs", "breeds", "inquiries"] as const).map((value) => <button key={value} className={`admin-tab${tab === value ? " active" : ""}`} onClick={() => setTab(value)} role="tab" aria-selected={tab === value}>{value === "dogs" ? `Dog listings (${dogs.length})` : value === "breeds" ? `Breeds (${breeds.length})` : `Inquiries (${inquiries.length})`}</button>)}
    </div>
    {error && <p className="status-message error" role="alert">{error}</p>}
    {notice && <p className="status-message" role="status">{notice}</p>}
    {loading ? <div className="admin-card">Loading your studio…</div> : <>
      {tab === "breeds" && <BreedManager breeds={breeds} refresh={load} onError={reportError} onNotice={setNotice} onDelete={remove} />}
      {tab === "dogs" && <DogManager breeds={breeds} dogs={dogs} refresh={load} onError={reportError} onNotice={setNotice} onDelete={remove} />}
      {tab === "inquiries" && <InquiryManager inquiries={inquiries} dogs={dogs} refresh={load} onError={reportError} onNotice={setNotice} onDelete={remove} />}
    </>}
    <p className="muted-note" style={{ marginTop: 22 }}>Starter listings are drafts marked for owner review. Verify every detail before publishing.</p>
  </div></main>;
}

function BreedManager({ breeds, refresh, onError, onNotice, onDelete }: {
  breeds: Breed[]; refresh: () => Promise<void>; onError: (reason: unknown) => void; onNotice: (message: string) => void;
  onDelete: (url: string, noun: string) => Promise<void>;
}) {
  const empty = { name: "", slug: "", description: "", imageUrl: "" };
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const imageUrl = await uploadPetImage(file);
      setForm((current) => ({ ...current, imageUrl }));
      onNotice("Image uploaded. Save the breed to keep its image URL.");
    } catch (reason) { onError(reason); } finally { setUploading(false); }
  }

  function edit(breed: Breed) {
    setEditing(breed.id);
    setForm({ name: breed.name, slug: breed.slug, description: breed.description, imageUrl: breed.imageUrl });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await requestJson(editing ? `/api/admin/breeds/${editing}` : "/api/admin/breeds", {
        method: editing ? "PATCH" : "POST", body: JSON.stringify(form)
      });
      setForm(empty); setEditing(null); onNotice(`Breed ${editing ? "updated" : "created"}.`); await refresh();
    } catch (reason) { onError(reason); }
  }

  return <div className="admin-layout">
    <form className="admin-card" onSubmit={submit}><h2>{editing ? "Edit breed" : "Add a breed"}</h2>
      <div className="field"><label>Name</label><input required maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
      <div className="field"><label>URL slug</label><input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={120} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="e.g. chihuahua" /></div>
      <div className="field"><label>Description</label><textarea maxLength={3000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
      <div className="field"><label>Image URL</label><input type="text" maxLength={2000} value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="/images/chihuahua.jpg" /></div>
      <div className="field"><label>Upload a breed image</label><input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={upload} /><span className="muted-note">{uploading ? "Uploading…" : "JPG, PNG, or WebP; up to 6 MB. Requires Cloudinary setup."}</span></div>
      <button className="button" type="submit" disabled={uploading}>{editing ? "Save breed" : "Create breed"}</button>
      {editing && <button type="button" className="small-button" style={{ marginLeft: 8 }} onClick={() => { setEditing(null); setForm(empty); }}>Cancel</button>}
    </form>
    <section><div className="admin-list">{breeds.map((breed) => <article className="admin-row" key={breed.id}>
      <div><strong>{breed.name}</strong><small>/{breed.slug}<br />{breed.description || "No description"}</small></div>
      <div className="row-actions"><button className="small-button" onClick={() => edit(breed)}>Edit</button><button className="small-button danger" onClick={() => void onDelete(`/api/admin/breeds/${breed.id}`, "breed")}>Delete</button></div>
    </article>)}{breeds.length === 0 && <div className="admin-card">No breeds yet. Create one to start a catalog.</div>}</div></section>
  </div>;
}

function DogManager({ breeds, dogs, refresh, onError, onNotice, onDelete }: {
  breeds: Breed[]; dogs: Dog[]; refresh: () => Promise<void>; onError: (reason: unknown) => void; onNotice: (message: string) => void;
  onDelete: (url: string, noun: string) => Promise<void>;
}) {
  const starterPrice = (breedId: string) => breeds.find((breed) => breed.id === breedId)?.name.toLowerCase() === "pomeranian" ? "1100" : "850";
  const empty = { name: "", breedId: breeds[0]?.id ?? "", description: "", price: starterPrice(breeds[0]?.id ?? ""), imageUrl: "", status: "draft" as "draft" | "published" };
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  function edit(dog: Dog) {
    setEditing(dog.id);
    setForm({ name: dog.name, breedId: dog.breedId, description: dog.description, price: (dog.priceCents / 100).toFixed(2), imageUrl: dog.imageUrl, status: dog.status });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const imageUrl = await uploadPetImage(file);
      setForm((current) => ({ ...current, imageUrl }));
      onNotice("Image uploaded. Save the listing to keep its image URL.");
    } catch (reason) { onError(reason); } finally { setUploading(false); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const payload = {
        name: form.name,
        breedId: form.breedId,
        description: form.description,
        priceCents: Math.round(Number(form.price) * 100),
        imageUrl: form.imageUrl,
        status: form.status
      };
      await requestJson(editing ? `/api/admin/dogs/${editing}` : "/api/admin/dogs", {
        method: editing ? "PATCH" : "POST", body: JSON.stringify(payload)
      });
      setForm({ ...empty, breedId: breeds[0]?.id ?? "" }); setEditing(null);
      onNotice(`Listing ${editing ? "updated" : "created"}.`); await refresh();
    } catch (reason) { onError(reason); }
  }

  return <div className="admin-layout">
    <form className="admin-card" onSubmit={submit}><h2>{editing ? "Edit listing" : "Add a dog listing"}</h2>
      {breeds.length === 0 ? <p className="muted-note">Create a breed before adding a listing.</p> : <>
        <div className="field"><label>Name</label><input required maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="field"><label>Breed</label><select required value={form.breedId} onChange={(e) => setForm((current) => ({ ...current, breedId: e.target.value, price: editing ? current.price : starterPrice(e.target.value) }))}>{breeds.map((breed) => <option key={breed.id} value={breed.id}>{breed.name}</option>)}</select></div>
        <div className="field"><label>Description (verified details only)</label><textarea maxLength={3000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="field"><label>Price (USD)</label><input required type="number" min="550" max="1100" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /><span className="muted-note">Prices must be between $550 and $1,100.</span></div>
        <div className="field"><label>Image URL</label><input type="text" maxLength={2000} value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="/images/chihuahua-listing.jpg" /></div>
        <div className="field"><label>Upload a pet image</label><input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={upload} /><span className="muted-note">{uploading ? "Uploading…" : "JPG, PNG, or WebP; up to 6 MB. Requires Cloudinary setup."}</span></div>
        <div className="field"><label>Publication status</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as "draft" | "published" })}><option value="draft">Draft — owner review required</option><option value="published">Published</option></select></div>
        <button className="button" type="submit" disabled={uploading}>{editing ? "Save listing" : "Create listing"}</button>
        {editing && <button type="button" className="small-button" style={{ marginLeft: 8 }} onClick={() => { setEditing(null); setForm({ ...empty, breedId: breeds[0]?.id ?? "" }); }}>Cancel</button>}
      </>}
    </form>
    <section className="admin-list">{dogs.map((dog) => <article className="admin-row" key={dog.id}>
      <div><strong>{dog.name} <span className={`status-badge ${dog.status}`}>{dog.status}</span></strong><small>{dog.breedName} · ${(dog.priceCents / 100).toFixed(2)} USD<br />{dog.status === "draft" ? "Owner review required before publication. " : ""}{dog.description || "No description"}</small></div>
      <div className="row-actions"><button className="small-button" onClick={() => edit(dog)}>Edit</button><button className="small-button danger" onClick={() => void onDelete(`/api/admin/dogs/${dog.id}`, "listing")}>Delete</button></div>
    </article>)}{dogs.length === 0 && <div className="admin-card">No listings yet. Starter drafts appear after database seeding.</div>}</section>
  </div>;
}

function InquiryManager({ inquiries, dogs, refresh, onError, onNotice, onDelete }: {
  inquiries: Inquiry[]; dogs: Dog[]; refresh: () => Promise<void>; onError: (reason: unknown) => void; onNotice: (message: string) => void;
  onDelete: (url: string, noun: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState<Inquiry | null>(null);

  async function saveInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const element = event.currentTarget;
    const form = new FormData(element);
    const dogId = form.get("dogId") || null;
    const payload: Record<string, FormDataEntryValue | null> = {
      customerName: form.get("customerName"),
      email: form.get("email"),
      phone: form.get("phone"),
      message: form.get("message")
    };
    if (!editing || dogId !== editing.dogId) payload.dogId = dogId;
    try {
      await requestJson(editing ? `/api/admin/inquiries/${editing.id}` : "/api/admin/inquiries", {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(payload)
      });
      element.reset();
      onNotice(editing ? "Inquiry updated." : "Inquiry created.");
      setEditing(null);
      await refresh();
    } catch (reason) { onError(reason); }
  }

  function editInquiry(inquiry: Inquiry) {
    setEditing(inquiry);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function updateStatus(inquiry: Inquiry, status: Inquiry["status"]) {
    try {
      await requestJson(`/api/admin/inquiries/${inquiry.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      await refresh();
    } catch (reason) { onError(reason); }
  }

  return <div className="admin-layout">
    <form key={editing?.id ?? "new-inquiry"} className="admin-card" onSubmit={saveInquiry}><h2>{editing ? "Edit inquiry" : "Add an inquiry"}</h2>
      <div className="field"><label>Customer name</label><input name="customerName" defaultValue={editing?.customerName ?? ""} required maxLength={120} /></div>
      <div className="field"><label>Email</label><input name="email" type="email" defaultValue={editing?.email ?? ""} required maxLength={254} /></div>
      <div className="field"><label>Phone (optional)</label><input name="phone" type="tel" defaultValue={editing?.phone ?? ""} maxLength={40} /></div>
      <div className="field"><label>Dog (optional)</label><select name="dogId" defaultValue={editing?.dogId ?? ""}><option value="">General inquiry</option>{dogs.map((dog) => <option key={dog.id} value={dog.id}>{dog.name}</option>)}</select></div>
      <div className="field"><label>Message</label><textarea name="message" defaultValue={editing?.message ?? ""} required minLength={10} maxLength={3000} /></div>
      <button className="button" type="submit">{editing ? "Save inquiry" : "Create inquiry"}</button>
      {editing && <button type="button" className="small-button" style={{ marginLeft: 8 }} onClick={() => setEditing(null)}>Cancel</button>}
    </form>
    <section className="admin-list">{inquiries.map((inquiry) => <article className="admin-row" key={inquiry.id}>
    <div style={{ maxWidth: 720 }}><strong>{inquiry.customerName} <span className={`status-badge ${inquiry.status}`}>{inquiry.status.replace("_", " ")}</span></strong>
      <small><a href={`mailto:${encodeURIComponent(inquiry.email)}`}>{inquiry.email}</a>{inquiry.phone ? ` · ${inquiry.phone}` : ""}{inquiry.dogName ? ` · About ${inquiry.dogName}` : ""}<br />{new Date(inquiry.createdAt).toLocaleString()}</small>
      {inquiry.dogs.length > 0 && <div className="inquiry-dogs">{inquiry.dogs.map((dog) => <div className="inquiry-dog" key={dog.id}>
        <Image src={dog.imageUrl || "/images/chihuahua-listing.jpg"} alt={`${dog.breedName} — ${dog.name}`} width={88} height={88} />
        <span><strong>{dog.name}</strong><small>{dog.breedName}</small></span>
      </div>)}</div>}
      <p style={{ fontSize: 13, lineHeight: 1.65, whiteSpace: "pre-wrap", margin: "12px 0 0" }}>{inquiry.message}</p>
    </div>
    <div className="row-actions"><button className="small-button" onClick={() => editInquiry(inquiry)}>Edit</button><select aria-label="Inquiry status" className="small-button" value={inquiry.status} onChange={(event) => void updateStatus(inquiry, event.target.value as Inquiry["status"])}><option value="new">New</option><option value="in_progress">In progress</option><option value="closed">Closed</option></select><button className="small-button danger" onClick={() => void onDelete(`/api/admin/inquiries/${inquiry.id}`, "inquiry")}>Delete</button></div>
  </article>)}{inquiries.length === 0 && <div className="admin-card">No inquiries received yet.</div>}</section>
  </div>;
}
