# Skyline Weather

An installable, mobile-first weather app powered by the free [Open-Meteo](https://open-meteo.com/) API. No API key or backend is required.

## Features

- Current conditions using phone location
- City search and saved last location
- Next 24 hours and seven-day forecast
- Celsius/Fahrenheit toggle
- Wind, humidity, precipitation, and UV details
- Installable PWA with an offline app shell
- Responsive phone-first interface

## Run locally

Geolocation requires a secure origin. `localhost` is treated as secure by browsers:

```bash
npx serve .
```

Open the printed local URL. To test on a phone, deploy to GitHub Pages or another HTTPS host.

## GitHub Pages

In the repository, open **Settings → Pages**, choose **Deploy from a branch**, select `main` and `/ (root)`, then save. Once deployed, open the Pages URL on Android Chrome and choose **Add to Home screen**.

## APIs

- Open-Meteo Forecast API
- Open-Meteo Geocoding API
- BigDataCloud client-side reverse geocoding (used only to label GPS coordinates; forecast still works if unavailable)
