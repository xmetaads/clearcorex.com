// ============================================
// Vercel serverless function: GET /download
// Just 302-redirects to the GitHub Releases asset URL
// (set via DOWNLOAD_URL env var on Vercel).
// Used as a stable vanity URL: clearcorex.com/download
// ============================================
module.exports = (req, res) => {
  const url = (process.env.DOWNLOAD_URL || '').trim();
  if (!url) {
    return res.status(503).type('text').send(
      'Download URL is not configured. Set DOWNLOAD_URL env var to your GitHub Releases asset URL.'
    );
  }
  res.setHeader('Cache-Control', 'public, max-age=300');
  return res.redirect(302, url);
};
