# Fractionator

La calcolatrice usa il design C ed è disponibile su `/`. Il calcolo avviene nel browser.
L’app usa Next.js App Router, React, TypeScript e Tailwind.

Per avviarla in locale, usa Node.js 22.13 o successivo ed esegui `npm ci`, poi `npm run dev`.
Verifiche: `npm run lint`, `npm run typecheck`, `npm test`.

Per il deploy su hosting statico, esegui `npm ci` e `npm run build` dalla radice
del repository e pubblica il contenuto di `out/` alla radice del sito.
Il font Play è incluso in `public/fonts/` con licenza OFL.

Tastiera: `/` inserisce un denominatore; `:` divide; `*` moltiplica;
Invio calcola; Esc azzera. Le operazioni coinvolgono due operandi.
