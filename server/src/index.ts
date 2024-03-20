import { Hono } from "hono";
import user from "./routers/user";
import blog from "./routers/blog";
import { tag } from "./routers/tag";

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
app.route("api/v1/tag", tag);
export default app;
