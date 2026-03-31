import { decode } from "next-auth/jwt";
import User from "../models/User.js";

export async function requireAuth(req, res, next) {
  try {
    const token =
      req.cookies["authjs.session-token"] ||
      req.cookies["__Secure-authjs.session-token"];

    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const saltStr = 'authjs.session-token';

    if (req.cookies["__Secure-authjs.session-token"]) {
      saltStr = '__Secure-authjs.session-token';
    }

    const payload = await decode({
      token,
      secret: process.env.NEXTAUTH_SECRET,
      salt: saltStr,
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
