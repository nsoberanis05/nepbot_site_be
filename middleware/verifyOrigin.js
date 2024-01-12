async function verifyOrigin(req, res, next) {
  if (req.headers?.origin !== process.env.FRONTEND_ORIGIN) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

export default verifyOrigin;
