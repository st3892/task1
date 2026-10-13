import Link from "next/link";
import BakeryMark from "./components/bakery-mark";

export default function Home() {
  return (
    <main id="main-content" className="page-shell landing-shell">
      <div className="page-heading bakery-heading landing-heading">
        <span className="landing-whisk"><BakeryMark /></span>
        <span className="eyebrow">WELCOME TO WHISK TAKERS</span>
        <h1>Life’s messy.<br /><span>Whisk it for the biscuit.</span></h1>
        <p>A little AI humor. A little questionable taste. Bake a joke, judge the batch, and make yourself at home.</p>
      </div>
      <nav className="landing-cards" aria-label="Explore Whisk Takers">
        <Link href="/generate" className="landing-card landing-bake">
          <svg className="landing-art" viewBox="0 0 220 150" aria-hidden="true" focusable="false">
            <ellipse cx="110" cy="132" rx="69" ry="7" fill="#e4d2ba" />
            <path d="m149 64 29-40" fill="none" stroke="#77635b" strokeWidth="6" strokeLinecap="round" />
            <path d="M151 61c-22-4-36 17-20 27 17 10 37-8 20-27Zm0 0c-12 0-26 20-20 27m20-27c5 10-6 25-20 27m20-27-20 27" fill="none" stroke="#77635b" strokeWidth="2" strokeLinecap="round" />
            <path d="M57 82c-8-16 12-27 31-25-3-15 9-22 23-27-2 17 24 11 24 28 18-4 38 11 26 24Z" fill="#fffdf9" stroke="#dac5b4" strokeWidth="2" />
            <path d="M86 58q24 12 49 0M68 74q37 13 82 0" fill="none" stroke="#eadbca" strokeWidth="3" strokeLinecap="round" />
            <path d="M110 34q-4-18 9-23" fill="none" stroke="#597050" strokeWidth="3" strokeLinecap="round" />
            <path d="M116 21q9-10 17-4-8 9-17 4Z" fill="#879575" />
            <circle cx="108" cy="36" r="11" fill="#ad3047" /><ellipse cx="104" cy="32" rx="3" ry="4" fill="#ef9caa" />
            <path d="M47 83h126c-5 33-25 45-63 45S52 116 47 83Z" fill="#bdc9a7" stroke="#597050" strokeWidth="2.5" />
            <path d="M49 83q60 12 122 0M64 101q6 12 20 15" fill="none" stroke="#e7eddc" strokeWidth="4" strokeLinecap="round" />
            <path d="m43 52 5 4m108-10 5-3" stroke="#c1707b" strokeWidth="3" strokeLinecap="round" />
            <path d="m75 30 4-4m99 73 5-3" stroke="#a4754d" strokeWidth="3" strokeLinecap="round" />
            <path d="m37 107 3-5" stroke="#879575" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span className="eyebrow">FRESHLY WHIPPED NONSENSE</span>
          <h2>Bake a Joke</h2>
          <p>Give the kitchen an idea and see what comes out of the oven.</p>
          <span className="landing-card-action">Preheat the humor <span aria-hidden="true">↗</span></span>
        </Link>
        <Link href="/secret" className="landing-card landing-taste">
          <svg className="landing-art" viewBox="0 0 220 150" aria-hidden="true" focusable="false">
            <ellipse cx="110" cy="132" rx="73" ry="7" fill="#e4d2ba" />
            <ellipse cx="110" cy="124" rx="75" ry="12" fill="#e7eddc" stroke="#a4b18f" strokeWidth="2" />
            <ellipse cx="110" cy="122" rx="61" ry="7" fill="#fffdf9" />
            <path d="M56 69h108v42c0 18-108 18-108 0Z" fill="#edc0c5" stroke="#a4754d" strokeWidth="2" />
            <path d="M57 95q53 15 106 0v9q-53 16-106 0Z" fill="#775349" />
            <path d="M57 99q53 15 106 0" fill="none" stroke="#fff5df" strokeWidth="4" />
            <ellipse cx="110" cy="69" rx="54" ry="17" fill="#fffdf9" stroke="#dac5b4" strokeWidth="2" />
            <path d="M56 69c0 9 13 14 19 12v8c0 9 11 9 11 0v-4l17 2v5c0 8 11 8 11 0v-5l23-3v5c0 8 10 8 10 0v-8c11-3 17-7 17-12" fill="#fffdf9" stroke="#dac5b4" strokeWidth="2" strokeLinejoin="round" />
            <path d="M91 60c-7-9 2-15 11-15-1-9 7-12 13-17-1 12 15 9 16 19 9 0 15 8 9 13-11 6-38 6-49 0Z" fill="#fffdf9" stroke="#dac5b4" strokeWidth="2" />
            <path d="M101 47q14 7 27 1M98 58q19 6 34-1" fill="none" stroke="#eadbca" strokeWidth="2" strokeLinecap="round" />
            <path d="M114 28q-3-15 9-20" fill="none" stroke="#597050" strokeWidth="3" strokeLinecap="round" />
            <path d="M120 16q9-8 16-3-6 8-16 3Z" fill="#879575" />
            <circle cx="113" cy="31" r="10" fill="#ad3047" /><ellipse cx="109" cy="28" rx="2.5" ry="3.5" fill="#ef9caa" />
            <path d="m75 64 5 3m62 3 5-2m-35 39 4 2" stroke="#ad3047" strokeWidth="3" strokeLinecap="round" />
            <path d="m88 74 4-3m62 38 3-4m-83-3 3 3" stroke="#879575" strokeWidth="3" strokeLinecap="round" />
            <path d="m140 63 4 3m-25 7 4 2" stroke="#775349" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span className="eyebrow">YOUR TASTE. YOUR VERDICT.</span>
          <h2>Taste Test</h2>
          <p>Judge the batch one joke at a time. Like it or Boo the chef.</p>
          <span className="landing-card-action">Grab a fork <span aria-hidden="true">↗</span></span>
        </Link>
        <Link href="/profile" className="landing-card landing-cookbook">
          <svg className="landing-art" viewBox="0 0 220 150" aria-hidden="true" focusable="false">
            <ellipse cx="110" cy="134" rx="68" ry="8" fill="#e4d2ba" />
            <path d="M61 25h103v103H61q-12 0-12-12V37q0-12 12-12Z" fill="#879575" stroke="#526448" strokeWidth="3" />
            <path d="M63 25v103M58 119h106" stroke="#526448" strokeWidth="3" /><path d="M64 121h99v7H64" fill="#fff5df" />
            <rect x="80" y="42" width="65" height="58" rx="8" fill="#fff9ef" />
            <path d="M103 63c-10-6-16 9-6 13v10h29V76c10-4 4-19-6-13-1-12-16-12-17 0Z" fill="#fffdf9" stroke="#ad3047" strokeWidth="2" />
            <path d="M104 91h15M144 25v20l7-5 7 5V25" fill="#ad3047" stroke="#ad3047" strokeWidth="2" />
          </svg>
          <span className="eyebrow">A RECIPE THAT’S ALL YOU</span>
          <h2>My Cookbook</h2>
          <p>Your little corner of the kitchen. Same chef, fresh garnish.</p>
          <span className="landing-card-action">Make yourself at home <span aria-hidden="true">↗</span></span>
        </Link>
      </nav>
    </main>
  );
}
