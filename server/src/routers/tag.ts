import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

import { Hono, Context } from "hono";

export const tag = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
}>();

tag.get("/getPosts/:tag", async (c: Context) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());
  try {
    const res = await prisma.tags.findMany({
      where: {
        tag: String(c.req.param("tag")),
      },
      select: {
        posts: {
          select: {
            author: { select: { email: true } },
            id: true,
            authorId: true,
            title: true,
            content: true,
            createdAt: true,
          },
        },
      },
    });

    return c.json({
      posts: res[0].posts.map((post) => ({
        email: post.author.email,
        id: post.id,
        title: post.title,
        authorId: post.authorId,
        content: post.content,
        createdAt: post.createdAt,
      })),
    });
  } catch (e) {
    c.status(500);
    return c.json({ message: "Internal Server Error" });
  }
});

tag.get("/tags", async (c: Context) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());
  try {
    const tags = await prisma.tags.findMany();

    return c.json({
      tags: tags,
    });
  } catch (e) {
    c.status(500);
    return c.json({ message: "Tags Not found" });
  }
});
