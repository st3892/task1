import Generations from "../components/generations";

export default function GeneratePage() {
  return (
    <main id="main-content" className="page-shell">
      <div className="page-heading bakery-heading">
        <span className="eyebrow">A SMALL BATCH OF BIG FEELINGS</span>
        <h1>Bake a Joke<span className="brand-dot">.</span></h1>
        <p>Bring one idea. We’ll supply the questionable oven skills.</p>
      </div>
      <Generations />
    </main>
  );
}
