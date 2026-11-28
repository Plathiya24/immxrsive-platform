import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="stylesheet" href="/ecosystem-transitions.css" media="(prefers-reduced-motion: no-preference)" />
        <link rel="expect" href="#ecosystem-detail" media="(prefers-reduced-motion: no-preference)" blocking="render" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
