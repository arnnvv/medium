import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { verify } from "hono/jwt";
import { validatePost, validateUpdatePost } from "../../validate";

const blog = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    userId: string;
  };
}>();

blog.use(async (c, next) => {
  const header = c.req.header("authorization");
  if (!header) {
    c.status(401);
    return c.json({ error: "Token Missing" });
  }
  const token = header.split(" ")[1] || header.split(" ")[0];
  try {
    const response = await verify(token, c.env.JWT_SECRET);
    if (response.id) {
      c.set(`userId`, response.id);
      await next();
    } else {
      c.status(403);
      return c.json({ error: "Invalid token" });
    }
  } catch (error) {
    return c.json({ error: "You are not authorized" });
  }
});

blog
  .post(`/`, async (c) => {
    const body = await c.req.json();
    if (!validatePost(body)) {
      c.status(411);
      return c.json({ error: `Invalid post` });
    }

    const userId = c.get(`userId`);
    const prisma = new PrismaClient({
      datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate());

    try {
      const post = await prisma.post.create({
        data: {
          title: body.title,
          content: body.content,
          authorId: userId,
        },
      });
      return c.json({ id: post.id });
    } catch (error) {
      return c.json({ error: `Error creating post: ${error}` });
    }
  })
  .put(async (c) => {
    const body = await c.req.json();
    if (!validateUpdatePost(body)) {
      c.status(411);
      return c.json({
        message: "Inputs not correct",
      });
    }

    const userId = c.get(`userId`);
    const prisma = new PrismaClient({
      datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate());

    try {
      await prisma.post.update({
        where: {
          id: body.id,
          authorId: userId,
        },
        data: {
          title: body.title,
          content: body.content,
        },
      });
      return c.json({ message: "updated" });
    } catch (error) {
      return c.json({ error: `Error changing post: ${error}` });
    }
  });

blog.get("/:id", async (c) => {
  const id = c.req.param("id");
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());
  try {
    const post = await prisma.post.findFirst({
      where: {
        id,
      },
      select: {
        id: true,
        title: true,
        content: true,
        author: {
          select: {
            name: true,
          },
        },
      },
    });
    return c.json({ post });
  } catch (error) {
    c.status(411);
    return c.json({
      message: "Error while fetching blog post",
    });
  }
});

blog.get("/bulk", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const posts = await prisma.post.findMany({
      select: {
        content: true,
        title: true,
        id: true,
        author: {
          select: {
            name: true,
          },
        },
      },
    });

    return c.json({ posts });
  } catch (error) {
    c.status(411);
    return c.json({
      message: `Error while fetching blog post: ${error}`,
    });
  }
});

export default blog;
