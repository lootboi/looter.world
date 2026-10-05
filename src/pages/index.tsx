import Head from 'next/head';
import React from 'react';

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
        <span className="glyph glyph--circle" />
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
        <span className="glyph glyph--square" />
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
        <span className="glyph glyph--slash" />
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
        <span className="glyph glyph--plus" />
        <span className="nav__label">elsewhere</span>
        <span className="nav__sub">
          twitter
          <br />
          github
          <br />
          email
        </span>
      </a>
      <div className="logomark" aria-hidden="true">
        LT
      </div>
    </nav>

    <table className="meta">
      <tbody>
        <tr>
          <td className="meta__title" colSpan={2}>
            Looter.world
          </td>
          <td className="meta__key wide">Version</td>
          <td className="meta__val wide">v2.0.0</td>
        </tr>
        <tr>
          <td className="meta__key">Author</td>
          <td>
            <a href="https://twitter.com/AltLoot">@AltLoot</a>
          </td>
          <td className="meta__key wide">Updated</td>
          <td className="meta__val wide">2026-10-05</td>
        </tr>
      </tbody>
    </table>

    <header className="hero">
      <h1 className="hero__text">
        <span>Trading systems.</span>
        <span>Execution.</span>
        <span>Full-stack.</span>
      </h1>
    </header>

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
          <div className="box__head">Colophon</div>
          <ul className="list">
            <li>JetBrains Mono + Archivo Black</li>
            <li>hosted on Cloudflare Pages</li>
          </ul>
        </div>
      </div>
    </section>

    <section className="section">
      <div className="foot">
        <span>© looter.world</span>
        <span>built on a 1.25rem grid</span>
      </div>
    </section>
  </div>
);

export default IndexPage;
