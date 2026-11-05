"use client";

import Image from "next/image";
import { useState } from "react";
import { InquiryForm } from "@/components/inquiry-form";

type InquiryDog = {
  id: string;
  name: string;
  breedName: string;
  description: string;
  priceCents: number;
  imageUrl: string;
};

const money = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(cents / 100);

const maxEnquiryDogs = 3;

export function ListingEnquiry({ dogs, connected }: { dogs: InquiryDog[]; connected: boolean }) {
  const [selectedDogIds, setSelectedDogIds] = useState<string[]>([]);
  const selectedDogs = dogs.filter((dog) => selectedDogIds.includes(dog.id));

  function toggleDog(id: string) {
    setSelectedDogIds((current) => current.includes(id)
      ? current.filter((selectedId) => selectedId !== id)
      : current.length < maxEnquiryDogs ? [...current, id] : current);
  }

  return <>
    <section className="catalog-section" id="listings">
      <div className="catalog-inner">
        <div className="section-head">
          <div><h2>Available dogs</h2></div>
          <p className="section-subtitle">Prices range from $550 to $1,100. Add a dog to your enquiry and ask us about availability. No payment is taken here.</p>
        </div>
        {dogs.length === 0
          ? <div className="empty-state"><strong>{connected ? "No dogs are listed right now." : "Looking for a dog?"}</strong>{connected ? "Get in touch and ask us about upcoming availability." : "Please contact us directly for current availability."}</div>
          : <div className="dog-grid">{dogs.map((dog) => {
            const selected = selectedDogIds.includes(dog.id);
            const limitReached = selectedDogIds.length >= maxEnquiryDogs;
            return <article className="dog-card" key={dog.id}>
              <Image src={dog.imageUrl || "/images/chihuahua-listing.jpg"} alt={`${dog.breedName} — ${dog.name}`} width={640} height={470} />
              <div className="dog-card-body">
                <div className="dog-card-top">
                  <div><p className="dog-breed">{dog.breedName}</p><h3>{dog.name}</h3></div>
                  <span className="price">{money(dog.priceCents)}</span>
                </div>
                {dog.description && <p className="dog-description">{dog.description}</p>}
                <button
                  className={`button${selected ? " button-outline" : ""}`}
                  type="button"
                  aria-pressed={selected}
                  disabled={!selected && limitReached}
                  onClick={() => toggleDog(dog.id)}
                >{selected ? "Remove from enquiry" : limitReached ? "Enquiry list full" : "Add to enquiry"}</button>
              </div>
            </article>;
          })}</div>}
        {selectedDogs.length > 0 && <div className="enquiry-cart" aria-live="polite">
          <div><strong>{selectedDogs.length} {selectedDogs.length === 1 ? "dog" : "dogs"} added to your enquiry</strong><p>{selectedDogs.map((dog) => dog.name).join(", ")}</p></div>
          <a className="button" href="#contact">Continue to the form</a>
        </div>}
      </div>
    </section>

    <section className="section inquiry-section" id="contact">
      <div className="inquiry-intro"><h2>Tell us what you’re looking for</h2><p>Send a note about a dog you’ve added, or ask us a general question. We’ll get back to you.</p></div>
      <InquiryForm dogs={dogs} selectedDogIds={selectedDogIds} onRemoveDog={toggleDog} />
    </section>
  </>;
}
