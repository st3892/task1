import { supabase } from "../lib/supabase";

export default async function Home() {
  const { data: jokes, error } = await supabase
    .from("jokes")
    .select("*");

  if (error) {
    return <main id="main-content" className="page-shell"><div className="card empty-state" role="alert"><h1>Couldn’t load the jokes</h1><p>{error.message}</p></div></main>;
  }

  return (
    <main id="main-content" className="page-shell">
      <section className="hero">
        <div>
          <span className="eyebrow">A BYTE OF GOOD HUMOR</span>
          <h1>Serious about code.<br /><span>Not so serious about life.</span></h1>
          <p>Your well-deserved break from debugging. A collection of tech jokes to make your day a little lighter.</p>
          <a className="button" href="#jokes">Find your next laugh <span aria-hidden="true">↓</span></a>
        </div>
        <div className="hero-art" aria-hidden="true">
          <span className="art-spark">✳</span>
          <div className="code-note"><span className="code-dots">● ● ●</span><code>while (coding) {'{'}<br />&nbsp; takeABreak();<br />&nbsp; laugh();<br />{'}'}</code><span className="code-comment">{"// a feature, not a bug"}</span></div>
          <span className="smile-sticker">:)</span>
        </div>
      </section>
      <section id="jokes" className="jokes-section" aria-labelledby="jokes-heading">
        <div className="section-heading"><div><span className="eyebrow">THE COLLECTION</span><h2 id="jokes-heading">Fresh laughs, familiar problems.</h2></div><span className="count-badge">{jokes?.length ?? 0} jokes</span></div>
        {jokes?.length ? <ul className="joke-grid">
          {jokes.map((joke, index) => (
            <li key={joke.id} className="card joke-card">
              <div className="joke-card-top"><span className="category">{joke.category}</span><span className="joke-number">#{String(index + 1).padStart(2, "0")}</span></div>
              <p>{joke.text}</p>
              <div className="joke-card-bottom"><span aria-hidden="true">{'</>'}</span> A little comic relief</div>
            </li>
          ))}
        </ul> : <div className="card empty-state"><h3>The laughs are on their way.</h3><p>No jokes here yet. Check back soon for a little comic relief.</p></div>}
      </section>
    </main>
  );
}
