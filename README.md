# Dieci anni insieme 🚂❤️

Mini sito-regalo per un anniversario (10 anni). Mobile-first, tre schermate:

1. **Intro** — un trenino rosso attraversa lo schermo, poi l'invito a partire.
2. **Indovinello** — gate con password (3 indizi). La chiave è `IC1310` —
   iniziali + 13 (il giorno) + 10 (gli anni). Validazione tollerante:
   ignora maiuscole/minuscole, spazi e simboli; accetta `IC` o `CI`.
3. **Viaggio** — terreno alpino 3D (Three.js) con il percorso del Bernina
   Express da **Tirano** a **Sankt Moritz**; all'arrivo: fuochi d'artificio,
   cuoricini e il messaggio finale.

## Sviluppo

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/
npm run preview  # anteprima del build
```

## Deploy su Vercel (gratis)

Opzione rapida da terminale:

```bash
npm i -g vercel
vercel            # primo deploy (preview)
vercel --prod     # deploy in produzione
```

Vercel rileva Vite in automatico (build: `npm run build`, output: `dist`).
In alternativa: push del repo su GitHub e "Import Project" su vercel.com.

## Personalizzare

- **Password e indizi**: `src/screens/riddle.js`
- **Messaggio finale**: `src/screens/journey.js` (cerca "Auguri di 10 anni")
- **Colori/tema**: `src/style.css` (variabili `:root`)
- **Percorso 3D / waypoint**: `src/screens/journey.js` (array `waypoints2D`)
