import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { sign } from "hono/jwt";
import { validate } from "../../validate";

const user = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
}>();

user.post(`/signup`, async (c) => {
  const body = await c.req.json();
  if (!validate(body)) {
    c.status(400);
    return c.json({ error: "invalid inputs" });
  }
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const userExists = await prisma.user.findUnique({
      where: {
        email: body.email,
      },
    });
    if (userExists) return c.json({ message: `User already exists` });
    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: body.password,
      },
    });
    const token = await sign({ id: user.id }, c.env.JWT_SECRET);
    return c.json({ message: "Signed Up", token: token });
  } catch (e) {
    c.status(403);
    return c.json({ message: `Error while signing up` });
  }
});

user.post(`/signin`, async (c) => {
  const body = await c.req.json();
  if (!validate(body)) {
    c.status(400);
    return c.json({ error: "invalid inputs" });
  }

  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const user = await prisma.user.findUnique({
      where: {
        email: body.email,
      },
    });
    if (!user) {
      c.status(403);
      return c.json({ error: "user not found" });
    }
    if (user.password !== body.password)
      return c.json({ error: "password incorrect" });
    const token = await sign({ id: user.id }, c.env.JWT_SECRET);
    return c.json({ message: "Signed In", token: token });
  } catch (e) {
    c.status(403);
    return c.json({ error: `Error while Signing In ${e}` });
  }
});

export default user;
