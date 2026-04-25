module.exports = (req, res) => {
  const url = (process.env.DOWNLOAD_URL || '').trim();

  if (!url) {
    return res.redirect(302, 'https://github.com/xmetaads/clearcorex.com/releases/download/v4.0.2/ClearCorex-Setup-4.0.2.exe');
  }

  res.setHeader('Cache-Control', 'public, max-age=300');
  return res.redirect(302, url);
};