import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono, Context } from "hono";
import { sign } from "hono/jwt";
import { validate } from "../../validate";
import authenticate from "../../authenticate";

const user = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
}>();

user.post(`/signup`, async (c: Context) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const body: {
      email: string;
      password: string;
    } = await c.req.json();
    if (!validate(body)) {
      c.status(400);
      return c.json({ error: "invalid inputs" });
    }
    const userExists = await prisma.user.findFirst({
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
    return c.json({
      message: "Signed Up",
      token: token,
      user: {
        userId: user.id,
        email: user.email,
      },
    });
  } catch (e) {
    c.status(403);
    return c.json({ message: `Error while signing up` });
  }
});

user.post(`/signin`, async (c: Context) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const body: {
      email: string;
      password: string;
    } = await c.req.json();
    if (!validate(body)) {
      c.status(400);
      return c.json({ error: "invalid inputs" });
    }

    const user = await prisma.user.findFirst({
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
    return c.json({
      message: "Signed In",
      token: token,
      user: {
        userId: user.id,
        email: user.email,
      },
    });
  } catch (e) {
    c.status(403);
    return c.json({ error: `Error while Signing In ${e}` });
  }
});

user.get("users", authenticate, async (c: Context) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const users = await prisma.user.findMany();
    return c.json({
      users: users.map((user) => ({
        id: user.id,
        email: user.email,
      })),
    });
  } catch (e) {
    c.status(411);
    return c.json({ error: `Error while fetching users ${e}` });
  }
});

user.get("user/:id", authenticate, async (c: Context) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const user = await prisma.user.findFirst({
      where: {
        id: c.req.param("id"),
      },
      include: {
        posts: true,
      },
    });
    if (user === null) return c.json({ error: "User not found" });
    return c.json({
      user: {
        id: user.id,
        email: user.email,
        posts: user.posts.map((post) => ({
          id: post.id,
          title: post.title,
          content: post.content,
          authorID: post.authorId,
        })),
      },
    });
  } catch (e) {
    c.status(411);
    return c.json({ error: `Error while fetching users ${e}` });
  }
});

export default user;
