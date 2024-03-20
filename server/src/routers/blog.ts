import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono, Context } from "hono";
import { validatePost, validateUpdatePost } from "../../validate";
import authenticate from "../../authenticate";

const blog = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    userId: string;
  };
}>();

blog
  .use(authenticate)
  .post(`/`, async (c: Context) => {
    const userId = c.get(`userId`);
    const prisma = new PrismaClient({
      datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate());

    try {
      const body = await c.req.json();
      if (!validatePost(body)) {
        c.status(411);
        return c.json({ error: `Invalid post` });
      }
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
  .put(async (c: Context) => {
    const userId = c.get(`userId`);
    const prisma = new PrismaClient({
      datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate());

    try {
      const body = await c.req.json();
      if (!validateUpdatePost(body)) {
        c.status(411);
        return c.json({
          message: "Inputs not correct",
        });
      }

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

blog.get("/bulk", async (c: Context) => {
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
      include: {
        tags: true,
        author: true,
      },
    });

    return c.json({
      posts: posts.map((res) => ({
        id: res.id,
        email: res.author.email,
        authorId: res.author.id,
        title: res.title,
        content: res.content,
        tags: res.tags,
        createdAt: res.createdAt,
      })),
    });
  } catch (error) {
    c.status(411);
    return c.json({
      message: `Error while fetching blog post: ${error}`,
    });
  }
});

blog
  .route("/:id")
  .use(authenticate)
  .get(async (c: Context) => {
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
  })
  .put(async (c: Context) => {})
  .delete(async (c: Context) => {});
export default blog;
