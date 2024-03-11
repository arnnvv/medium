import { object, email, string, minLength, optional, safeParse } from "valibot";
import type { Output } from "valibot";

const signupin = object({
  email: string([email()]),
  password: string([minLength(8)]),
});

export type Signupin = Output<typeof signupin>;

const postInput = object({
  title: string(),
  content: string(),
});

export type PostInput = Output<typeof postInput>;

const updatePostInput = object({
  email: optional(string()),
  password: optional(string()),
});

export type UpdatePostInput = Output<typeof updatePostInput>;

export const validate = (input: Signupin) => {
  const result = safeParse(signupin, input);
  return result.success;
};

export const validatePost = (input: PostInput) => {
  const result = safeParse(postInput, input);
  return result.success;
};

export const validateUpdatePost = (input: UpdatePostInput) => {
  const result = safeParse(updatePostInput, input);
  return result.success;
};
