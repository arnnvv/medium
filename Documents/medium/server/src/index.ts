import { Hono } from "hono";
import user from "./routes/user";
import blog from "./routes/blog";

const app = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    userId: string;
  };
}>();

app.get(`/`, (c) => {
  return c.text("ARNNVV");
});

app.route("/api/v1/user", user);
app.route("/api/v1/blog", blog);

export default app;
