# Mijn Leesreis Portfolio

Een volledig client-side leesportfolio voor leerlingen. De app gebruikt geen backend, geen API-routes, geen server actions, geen externe API-calls, geen API keys en geen environment variables.

## Lokaal starten

Installeer dependencies:

```bash
npm install
```

Start de ontwikkelserver:

```bash
npm run dev
```

Open daarna:

```text
http://localhost:3000/mijn-leesreis-portfolio
```

De app gebruikt `localStorage`, dus gegevens blijven lokaal bewaard in dezelfde browser.

## Build maken

Maak een statische build:

```bash
npm run build
```

Next.js gebruikt `output: "export"` en schrijft de statische site naar de map `out`.

## GitHub Pages activeren

1. Push de repository naar GitHub.
2. Zorg dat de standaardbranch `main` heet.
3. Ga op GitHub naar `Settings` > `Pages`.
4. Kies bij `Build and deployment` voor `GitHub Actions`.
5. Push naar `main`. De workflow `.github/workflows/deploy.yml` bouwt de app en publiceert de map `out`.

## Live URL openen

Voor een repository met de naam `mijn-leesreis-portfolio` wordt de app gepubliceerd op:

```text
https://<gebruikersnaam>.github.io/mijn-leesreis-portfolio/
```

De vaste `basePath` staat in `next.config.ts`:

```ts
const repositoryBasePath = "/mijn-leesreis-portfolio";
```

Gebruik je een andere repositorynaam, pas die waarde aan naar `"/jouw-repositorynaam"` en draai opnieuw `npm run build`.

## Troubleshooting: CSS laadt niet

Als de pagina wel opent maar de styling ontbreekt, klopt meestal de `basePath` niet.

Controleer:

- De repositorynaam op GitHub.
- De waarde van `repositoryBasePath` in `next.config.ts`.
- Of GitHub Pages op `GitHub Actions` staat.
- Of de workflow succesvol is afgerond.

Voorbeeld: bij repository `mijn-leesreis-portfolio` moet `repositoryBasePath` exact `"/mijn-leesreis-portfolio"` zijn.
