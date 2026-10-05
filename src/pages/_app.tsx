import Head from 'next/head';
import React from 'react';
import '../styles/global.css';

const App = ({ Component, pageProps }) => (
  <>
    <Head>
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1"
        key="viewport"
      />
    </Head>
    <Component {...pageProps} />
  </>
);

export default App;
