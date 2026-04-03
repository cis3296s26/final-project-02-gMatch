const { decode } = require("next-auth/jwt");
const User = require("../models/User");

async function requireAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) return res.status(401).json({ error: "Unauthorized" });

    let saltStr = "authjs.session-token";

    if (req.cookies?.["__Secure-authjs.session-token"]) {
      saltStr = "__Secure-authjs.session-token";
    }

    const payload = await decode({
      token,
      secret: process.env.NEXTAUTH_SECRET,
      salt: process.env.AUTH_SALT || '',
    });

    if (!payload) return res.status(401).json({ error: "Unauthorized" });

    // get user id using email from payload
    const usr = await User.findOne({ email: payload.email });

    if (!usr) return res.status(401).json({ error: "Unauthorized" });

    req.user = { ...payload, id: usr._id };
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ error: "Invalid session" });
  }
}

module.exports = { requireAuth };
