import Head from 'next/head';
import React from 'react';
import AsciiBanner from '../components/AsciiBanner';
import BtcChart from '../components/BtcChart';

const projects = [
  { repo: 'lootbox', note: 'hyperliquid orderbook classes' },
  {
    repo: 'nodeballer',
    note: 'hypixel auction CLI',
    children: [{ repo: 'lootballer-api', note: 'auction API facade' }],
  },
  { repo: 'lazy_boy_flipper', note: 'joepegs terminal helper' },
  { repo: 'lazy_boy_minter', note: 'lazy launchpeg mints' },
  { repo: 'hardhat-template-js', note: 'avalanche starter' },
];

const Repo = ({ repo, note }: { repo: string; note: string }) => (
  <>
    <a href={`https://github.com/lootboi/${repo}`}>{repo}</a>{' '}
    <span className="note">{note}</span>
  </>
);

type Weather = {
  place: string;
  temp: number;
  high: number;
  low: number;
  unit: string;
  sky: string;
  wind: number;
  windUnit: string;
};

// Served by functions/api/weather.js, which locates the visitor by IP.
const LocalWeather = () => {
  const [weather, setWeather] = React.useState<Weather | null>(null);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    fetch('/api/weather')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setWeather)
      .catch(() => setFailed(true));
  }, []);

  if (failed) return <li>the sky is offline</li>;
  if (!weather) return <li>checking the sky…</li>;

  const { place, temp, high, low, unit, sky, wind, windUnit } = weather;
  return (
    <>
      <li>{place}</li>
      <li>
        {temp}
        {unit} · {sky}
      </li>
      <li>
        H {high}° L {low}° · wind {wind} {windUnit}
      </li>
    </>
  );
};

// Nav icons: pieces of a trade (candle, order ticket, order book, route).
const icons = {
  about: (
    <>
      <rect className="ink" x="15" y="1" width="2" height="30" />
      <rect className="ink" x="9" y="8" width="14" height="16" />
    </>
  ),
  writing: (
    <>
      <path
        className="ink"
        d="M5 1 H27 V31 L23.3 28 L19.7 31 L16 28 L12.3 31 L8.7 28 L5 31 Z"
      />
      <rect className="cut" x="9" y="7" width="14" height="3" />
      <rect className="cut" x="9" y="13" width="10" height="3" />
      <rect className="cut" x="9" y="19" width="12" height="3" />
    </>
  ),
  projects: (
    <>
      <rect
        className="line"
        strokeWidth="2"
        x="5"
        y="2"
        width="26"
        height="4"
      />
      <rect
        className="line"
        strokeWidth="2"
        x="13"
        y="9"
        width="18"
        height="4"
      />
      <rect className="ink" x="11" y="18" width="20" height="5" />
      <rect className="ink" x="3" y="26" width="28" height="5" />
    </>
  ),
  elsewhere: (
    <>
      <path className="line" strokeWidth="3" d="M6 26 H16 V6 H26" />
      <circle className="ink" cx="6" cy="26" r="5" />
      <circle className="ink" cx="26" cy="6" r="5" />
    </>
  ),
};

const Glyph = ({ name }: { name: keyof typeof icons }) => (
  <span className="glyph">
    <svg viewBox="0 0 32 32" aria-hidden="true">
      {icons[name]}
    </svg>
  </span>
);

const IndexPage = () => (
  <div className="page">
    <Head>
      <title>looter.world</title>
    </Head>

    <nav className="nav">
      <div className="wordmark">
        looter
        <br />
        world
      </div>
      <a className="nav__item" href="#about">
        <Glyph name="about" />
        <span className="nav__label">about</span>
        <span className="nav__sub">
          who
          <br />
          what i do
          <br />
          now
        </span>
      </a>
      <a className="nav__item" href="#writing">
        <Glyph name="writing" />
        <span className="nav__label">writing</span>
        <span className="nav__sub">
          posts
          <br />
          notes
          <br />
          substack
        </span>
      </a>
      <a className="nav__item" href="#projects">
        <Glyph name="projects" />
        <span className="nav__label">projects</span>
        <span className="nav__sub">
          code
          <br />
          tools
          <br />
          experiments
        </span>
      </a>
      <a className="nav__item" href="#elsewhere">
        <Glyph name="elsewhere" />
        <span className="nav__label">elsewhere</span>
        <span className="nav__sub">
          twitter
          <br />
          github
          <br />
          email
        </span>
      </a>
    </nav>

    <header>
      <h1 className="sr-only">looter.world</h1>
      <AsciiBanner word="LOOTER" />
    </header>

    <BtcChart />

    <section className="section" id="about">
      <h2 className="label">
        <span className="label__n">01</span> About{' '}
        <span className="tag">update</span>
      </h2>
      <p>
        Founding engineer at{' '}
        <a href="https://tradegenius.com">GeniusTerminal</a>.<br />
        $20B+ onchain. EVM and Solana. Still shipping.
      </p>
      <ul className="list">
        <li>Full-stack</li>
        <li>EVM &amp; Solana</li>
        <li>Trading systems &amp; execution</li>
        <li>$20B+ onchain volume processed</li>
      </ul>
    </section>

    <section className="section" id="writing">
      <h2 className="label">
        <span className="label__n">02</span> Writing
      </h2>
      <ul className="rows">
        <li>
          <a href="https://looter.substack.com/p/making-blockchain-data-go-brrrrrrr">
            Making blockchain data go brrrrrrr
          </a>
          <span className="lead" />
          <span className="date">python · cryo</span>
        </li>
        <li>
          <span>more soon :)</span>
          <span className="lead" />
          <span className="date">—</span>
        </li>
      </ul>
    </section>

    <section className="section" id="projects">
      <h2 className="label">
        <span className="label__n">03</span> Projects
      </h2>
      <ul className="tree">
        <li>
          ~/lootboi
          <ul>
            {projects.map((p) => (
              <li key={p.repo}>
                <Repo {...p} />
                {p.children && (
                  <ul>
                    {p.children.map((c) => (
                      <li key={c.repo}>
                        <Repo {...c} />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </li>
      </ul>
    </section>

    <hr />

    <section className="section" id="elsewhere">
      <h2 className="label">
        <span className="label__n">04</span> Elsewhere
      </h2>
      <div className="grid">
        <div className="box">
          <div className="box__head">Social</div>
          <ul className="list">
            <li>
              <a href="https://twitter.com/AltLoot">twitter.com/AltLoot</a>
            </li>
            <li>
              <a href="https://github.com/lootboi">github.com/lootboi</a>
            </li>
          </ul>
        </div>
        <div className="box">
          <div className="box__head">Local weather</div>
          <ul className="list" aria-live="polite">
            <LocalWeather />
          </ul>
        </div>
      </div>
    </section>
  </div>
);

export default IndexPage;
