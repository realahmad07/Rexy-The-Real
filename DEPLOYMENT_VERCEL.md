# Deploying Rexy AI Auditor to Vercel

Since this application uses a full-stack Express + Vite architecture, deploying to Vercel requires a specific setup to handle both the frontend assets and the backend API routes.

## Prerequisites
- A Vercel account.
- The Vercel CLI installed (`npm i -g vercel`) or your GitHub repository connected to Vercel.

## Step 1: Configuration (`vercel.json`)
Create a `vercel.json` file in the root of your project with the following content:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    },
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

## Step 2: Environment Variables
Ensure you add the following environment variables in your Vercel project settings:
- `GEMINI_API_KEY`: Your Google Gemini API Key.
- `DEEPSEEK_API_KEY`: (Optional) Your DeepSeek API Key.
- `VITE_REXY_DATABASE_ID`: (Optional) Your Firestore Database ID.

## Step 3: Server Adjustments
In `server.js`, ensure that the Express app is exported as a module so Vercel can wrap it:

```javascript
// At the bottom of server.js
export default app;
```
*(Note: Vercel normally handles the listening part themselves if you export the app instance)*.

## Step 4: Build Command
Verify that your `npm run build` command correctly generates the frontend in the `dist` folder. In AI Studio, this is usually configured correctly by default.

## Alternative: Cloud Run (Recommended)
This app is already optimized for **Google Cloud Run**. You can deploy it using the "Deploy" button in the AI Studio interface, which is the most reliable way to maintain the full-stack performance and containerized environment.
