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
      error: `Error while fetching blog post: ${error}`,
    });
  }
});

blog.get("/user-posts", authenticate, async (c: Context) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const posts = await prisma.post.findMany({
      where: {
        authorId: c.get("userId"),
      },
    });
    return c.json({ posts });
  } catch (error) {
    c.status(500);
    return c.json({ error: `Error while fetching blog post: ${error}` });
  }
});

blog.post(`/create-post`, authenticate, async (c: Context) => {
  const userId = c.get(`userId`);
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const body: {
      title: string;
      content: string;
      tags: string;
    } = await c.req.json();

    const tagNames = body.tags.split(",").map((tag) => tag.trim());

    if (!validatePost(body)) {
      c.status(411);
      return c.json({ error: `Invalid post` });
    }
    const post = await prisma.post.create({
      data: {
        title: body.title,
        content: body.content,
        authorId: userId,
        tags: {
          connectOrCreate: tagNames.map((tag) => ({
            where: { tag },
            create: { tag },
          })),
        },
      },
      include: {
        tags: true,
      },
    });
    return c.json({
      message: "Post created",
      post: {
        id: post.id,
        title: post.title,
        content: post.content,
        tags: post.tags.map((tag) => tag.tag),
        createdAt: post.createdAt,
      },
    });
  } catch (error) {
    return c.json({ error: `Error creating post: ${error}` });
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
          authorId: c.get("userId"),
        },
        include: {
          tags: true,
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
      if (!post) return c.json({ error: "Post does not exist" });
      return c.json({
        post: {
          id: post.id,
          title: post.title,
          content: post.content,
          tags: post.tags,
          createdAt: post.createdAt,
        },
      });
    } catch (error) {
      c.status(411);
      return c.json({
        error: "Error while fetching blog post",
      });
    }
  })
  .put(async (c: Context) => {
    const id = c.req.param("id");
    const prisma = new PrismaClient({
      datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate());
    try {
      const body: {
        title: string;
        content: string;
        tags: string;
      } = await c.req.json();

      if (!validateUpdatePost(body)) {
        c.status(411);
        return c.json({ error: `Invalid post` });
      }

      const tagNames = body.tags.split(",").map((tag) => tag.trim());

      const postExist = await prisma.post.findFirst({
        where: {
          id: id,
          authorId: c.get("userId"),
        },
      });
      if (!postExist) return c.json({ message: "Post not found" });
      const post = await prisma.post.update({
        where: {
          id: id,
          authorId: c.get("userId"),
        },
        data: {
          content: body.content,
          title: body.title,
          tags: {
            connectOrCreate: tagNames.map((tag) => ({
              where: { tag },
              create: { tag },
            })),
          },
        },
        include: {
          tags: true,
        },
      });
      return c.json({
        data: {
          id: post.id,
          title: post.title,
          content: post.content,
          tags: post.tags,
          createdAt: post.createdAt,
        },
      });
    } catch (error) {
      c.status(500);
      return c.json({ error: `Error while updating blog post: ${error}` });
    }
  })
  .delete(async (c: Context) => {
    const id = c.req.param("id");
    const prisma = new PrismaClient({
      datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate());
    try {
      const postExist = await prisma.post.findFirst({
        where: {
          id: id,
          authorId: c.get("userId"),
        },
      });
      if (!postExist) {
        return c.json({ error: "Post not found" });
      }
      await prisma.post.delete({
        where: {
          id: id,
          authorId: c.get("userId"),
        },
      });
      return c.json({
        message: "post deleted",
      });
    } catch (error) {
      c.status(500);
      return c.json({ error: `Error while deleting blog post: ${error}` });
    }
  });

export default blog;
