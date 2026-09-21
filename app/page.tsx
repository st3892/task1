import { supabase } from "../lib/supabase";

export default async function Home() {
  const { data: jokes, error } = await supabase
    .from("jokes")
    .select("*");

  if (error) {
    return <p>{error.message}</p>;
  }

  return (
    <main>
      <h1>Tech Jokes</h1>

      <ul>
        {jokes?.map((joke) => (
          <li key={joke.id}>
            {joke.text} - {joke.category}
          </li>
        ))}
      </ul>
    </main>
  );
}
