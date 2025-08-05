# IOL MEP Calculator - Jamstack

A static web application that calculates MEP (Mercado Electrónico de Pagos) rates using AL30 and AL30D prices from Invertir Online API.

## Architecture

- **Frontend**: Static HTML, CSS, and JavaScript served from `/public`
- **Backend**: Serverless function on Netlify Functions
- **Deployment**: Jamstack hosting (Netlify recommended)

## Environment Variables

Set these in your Netlify environment settings:

```
IOL_USERNAME=your_iol_username
IOL_PASSWORD=your_iol_password
```

## Local Development

1. Install Netlify CLI: `npm install -g netlify-cli`
2. Install dependencies: `npm install`
3. Create `.env` file with your IOL credentials
4. Run locally: `npm run dev`

## Deployment

1. Connect your repository to Netlify
2. Set environment variables in Netlify dashboard
3. Deploy automatically on push to main branch

## Files

- `public/` - Static assets served directly
- `netlify/functions/calculate-mep.js` - Serverless API function
- `netlify.toml` - Netlify configuration