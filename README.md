# train-ui

Vue frontends for the train project. The repository contains two independent applications:

- `web/`: customer-facing application
- `admin/`: administration application

## Local development

The backend gateway must be available at `http://localhost:8000`.

```bash
npm run install:all
npm run dev:web
npm run dev:admin
```

The web application runs at `http://localhost:8080`. The admin application runs at `http://localhost:9090`.

## Build

```bash
npm run build
```

## GitHub Pages

The Pages workflow publishes:

- web application: `https://ycymac.github.io/train-ui/`
- admin application: `https://ycymac.github.io/train-ui/admin/`

Configure the repository before using Pages with a live backend:

1. Open **Settings > Pages** and select **GitHub Actions** as the source.
2. Open **Settings > Secrets and variables > Actions > Variables**.
3. Create `VUE_APP_SERVER` with the HTTPS URL of the deployed gateway.
4. Allow the origin `https://ycymac.github.io` in the deployed gateway CORS configuration.

The deployed Pages builds use the HTTPS gateway URL `https://116.204.46.30`. The gateway is exposed through an Nginx reverse proxy on port `443`; the internal gateway port `8000` is not exposed publicly.
