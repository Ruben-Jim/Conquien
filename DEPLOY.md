# Deploying to GitHub Pages

This guide explains how to deploy your Conquian game to GitHub Pages.

## Automatic Deployment (Recommended)

The project includes a GitHub Actions workflow that automatically deploys to GitHub Pages when you push to the `master` or `main` branch.

### Setup Steps:

1. **Enable GitHub Pages in your repository:**
   - Go to your repository on GitHub
   - Click on **Settings** → **Pages**
   - Under "Source", select **GitHub Actions**

2. **Push your code:**
   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin master
   ```

3. **Monitor the deployment:**
   - Go to the **Actions** tab in your GitHub repository
   - You should see the "Deploy to GitHub Pages" workflow running
   - Once complete, your app will be available at: `https://[your-username].github.io/[repository-name]/`

## Manual Deployment

If you prefer to deploy manually:

1. **Build the web app:**
   ```bash
   npm run build:web
   ```

2. **Deploy to GitHub Pages:**
   ```bash
   npm run deploy
   ```

   This will:
   - Build the web app
   - Push the `web-build` directory to the `gh-pages` branch
   - Make it available on GitHub Pages

## Important Notes

- The app will be available at: `https://[your-username].github.io/[repository-name]/`
- Make sure your Firebase Realtime Database rules allow public access (for development)
- The web build creates static files in the `web-build` directory
- GitHub Pages serves static files, so all routing is handled client-side

## Troubleshooting

If the deployment fails:
1. Check the GitHub Actions logs in the **Actions** tab
2. Ensure Node.js 18+ is being used
3. Verify all dependencies are installed correctly
4. Make sure the `web-build` directory is generated after running `npm run build:web`

