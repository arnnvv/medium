import { Context, Next } from "hono";
import { verify } from "hono/jwt";

export default async function authenticate(c: Context, next: Next) {
  const header = c.req.header("Authorization");
  if (!header) {
    c.status(401);
    return c.json({ error: "Token Missing" });
  }
  const token = header.split(" ")[1] || header.split(" ")[0];
  try {
    const response = await verify(token, c.env.JWT_SECRET);
    if (response) {
      c.set(`userId`, response.id);
      await next();
    } else {
      c.status(403);
      return c.json({ error: "Invalid token" });
    }
  } catch (error) {
    return c.json({ error: "You are not authorized" });
  }
}
