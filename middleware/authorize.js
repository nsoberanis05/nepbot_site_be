async function authorize(req, res, next) {
  try {
    if (req.user) next();
    else {
      res.status(401).json({ error: "Unauthorized" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Something went wrong, please try again later." });
  }
}

export default authorize;
