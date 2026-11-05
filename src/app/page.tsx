import Image from "next/image";
import { InquiryForm } from "@/components/inquiry-form";
import { getPublicCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
const galleryBreeds = [
  { name: "Chihuahua", slug: "chihuahua", photoCount: 34 },
  { name: "Pomeranian", slug: "pomeranian", photoCount: 20 }
];

export default async function HomePage() {
  const catalog = await getPublicCatalog();
  return <>
    {!catalog.connected && <div className="setup-notice">For the latest availability, please contact us directly.</div>}
    <header className="site-header">
      <a className="brand" href="#" aria-label="Little Paws home">Little Paws</a>
      <nav className="nav-links" aria-label="Main navigation">
        <a href="#breeds">Breeds</a><a href="#photos">Photos</a><a href="#listings">Available dogs</a>
        <a className="button" href="#contact">Contact</a>
      </nav>
    </header>

    <main>
      <section className="hero">
        <div className="hero-copy">
          <h1>Chihuahuas<br />&amp; Pomeranians</h1>
          <p>Browse the photos, check current listings, or send us a message with a question.</p>
          <div className="hero-actions"><a className="button" href="#photos">See the photos</a><a className="button button-outline" href="#contact">Get in touch</a></div>
        </div>
        <div className="hero-art" aria-label="Portraits of Chihuahua and Pomeranian dogs">
          <Image className="hero-main-photo" src="/images/pomeranian.jpg" alt="Pomeranian outdoors" width={720} height={900} priority />
          <Image className="hero-photo-small" src="/images/chihuahua.jpg" alt="Chihuahua resting indoors" width={600} height={700} priority />
        </div>
      </section>

      <section className="section" id="breeds">
        <div className="section-head">
          <div><h2>Meet the breeds</h2></div>
          <p className="section-subtitle">Have a question about Chihuahuas or Pomeranians? Send us a message.</p>
        </div>
        <div className="breed-grid">
          {catalog.breeds.map((breed) => <article className="breed-card" key={breed.id}>
            <Image className="breed-card-image" src={breed.imageUrl || "/images/chihuahua.jpg"} alt={`${breed.name} photo`} width={740} height={500} />
            <div className="breed-card-body"><h3>{breed.name}</h3>{breed.description && <p>{breed.description}</p>}<a className="text-link" href="#contact">Ask about {breed.name.toLowerCase()} <span aria-hidden>→</span></a></div>
          </article>)}
        </div>
      </section>

      <section className="section gallery-section" id="photos">
        <div className="section-head">
          <div><h2>From our photo collection</h2></div>
          <p className="section-subtitle">These photos show the breeds; they don’t represent specific dogs currently available.</p>
        </div>
        {galleryBreeds.map((breed) => <div className="gallery-breed" key={breed.slug}>
          <div className="gallery-breed-heading"><h3>{breed.name}</h3><span>{breed.photoCount} photos</span></div>
          <div className="gallery-grid">
            {Array.from({ length: breed.photoCount }, (_, index) =>
              <Image
                className="gallery-photo"
                key={`${breed.slug}-${index + 1}`}
                src={`/images/gallery/${breed.slug}-${String(index + 1).padStart(2, "0")}.jpg`}
                alt={`${breed.name}`}
                width={640}
                height={480}
                sizes="(max-width: 540px) 50vw, (max-width: 800px) 33vw, 25vw"
              />
            )}
          </div>
        </div>)}
      </section>

      <section className="catalog-section" id="listings">
        <div className="catalog-inner">
          <div className="section-head"><div><h2>Available dogs</h2></div><p className="section-subtitle">Prices are in USD. Contact us to ask about a listing. This site doesn’t take payments or reservations.</p></div>
          {catalog.dogs.length === 0 ? <div className="empty-state"><strong>{catalog.connected ? "No dogs are listed right now." : "Looking for current availability?"}</strong>{catalog.connected ? "Get in touch with questions about either breed." : "Please contact us directly. The photos above show the breeds, not dogs currently for sale."}</div> :
            <div className="dog-grid">{catalog.dogs.map((dog) => <article className="dog-card" key={dog.id}>
              <Image src={dog.imageUrl || "/images/chihuahua-listing.jpg"} alt={`${dog.breedName} listing`} width={640} height={470} />
              <div className="dog-card-body"><div className="dog-card-top"><div><h3>{dog.name}</h3><p>{dog.breedName}</p></div><span className="price">{money(dog.priceCents)}</span></div>
                <p>{dog.description}</p><a href="#contact" className="button">Send an inquiry</a></div>
            </article>)}</div>}
        </div>
      </section>

      <section className="section inquiry-section" id="contact">
        <div className="inquiry-intro"><h2>Have a question?</h2><p>Send us a message about a breed or one of the listings. We’ll get back to you.</p></div>
        <InquiryForm dogs={catalog.dogs} />
      </section>
    </main>
    <footer className="site-footer"><div className="footer-inner">
      <div><a className="brand" href="#">Little Paws</a><p>Chihuahuas &amp; Pomeranians</p></div>
      <div className="footer-links"><a href="#breeds">Breeds</a><a href="#photos">Photos</a><a href="#listings">Available dogs</a><a href="#contact">Contact</a><a href="/admin/login">Admin</a></div>
      <p>© {new Date().getFullYear()} Little Paws</p>
    </div></footer>
  </>;
}
