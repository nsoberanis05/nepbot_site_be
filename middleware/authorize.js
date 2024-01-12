async function authorize(req, res, next) {
  try {
    if (!req.user) res.status(401).json({ error: "Unauthorized" });
    return;
  } catch (error) {
    res
      .status(500)
      .json({ error: "Something went wrong, please try again later." });
  }

  await next();
}

export default authorize;
