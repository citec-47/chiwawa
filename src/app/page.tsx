import Image from "next/image";
import { ListingEnquiry } from "@/components/listing-enquiry";
import { getPublicCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

const galleryBreeds = [
  { name: "Chihuahua", slug: "chihuahua", photoCount: 34, summary: "Tiny, alert, and full of personality." },
  { name: "Pomeranian", slug: "pomeranian", photoCount: 20, summary: "Fluffy, bright-eyed, and naturally playful." }
];

const galleryDescriptions = [
  "Bright-eyed and curious.",
  "A happy little companion.",
  "Ready for cuddles and playtime.",
  "Soft, confident, and full of charm."
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
            {Array.from({ length: breed.photoCount }, (_, index) => {
              const description = index === 0 ? breed.summary : galleryDescriptions[index % galleryDescriptions.length];
              return <article className="gallery-card" key={`${breed.slug}-${index + 1}`}>
                <Image
                  className="gallery-photo"
                  src={`/images/gallery/${breed.slug}-${String(index + 1).padStart(2, "0")}.jpg`}
                  alt={`${breed.name} photo ${index + 1}`}
                  width={640}
                  height={480}
                  sizes="(max-width: 540px) 50vw, (max-width: 800px) 33vw, 25vw"
                />
                <div className="gallery-card-body">
                  <h4>{breed.name}</h4>
                  <p>{description}</p>
                </div>
              </article>;
            })}
          </div>
        </div>)}
      </section>

      <ListingEnquiry dogs={catalog.dogs} connected={catalog.connected} />
    </main>
    <footer className="site-footer"><div className="footer-inner">
      <div><a className="brand" href="#">Little Paws</a><p>Chihuahuas &amp; Pomeranians</p></div>
      <div className="footer-links"><a href="#breeds">Breeds</a><a href="#photos">Photos</a><a href="#listings">Available dogs</a><a href="#contact">Contact</a><a href="/admin/login">Admin</a></div>
      <p>© {new Date().getFullYear()} Little Paws</p>
    </div></footer>
  </>;
}
