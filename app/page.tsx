import Generations from "./components/generations";

export default function Home() {
  return (
    <main id="main-content" className="page-shell home-shell">
      <div className="page-heading bakery-heading">
        <span className="eyebrow">A SMALL BATCH OF BIG FEELINGS</span>
        <h1>Life’s messy.<br /><span>Make it a little sweeter.</span></h1>
        <p>Freshly whipped jokes for whatever life is serving.</p>
      </div>
      <Generations />
    </main>
  );
}
