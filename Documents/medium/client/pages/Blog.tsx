"use client";
import axios from "axios";
import { useEffect, useState } from "react";
const BACKEND_URL = process.env.BACKEND_URL;

const getBlog = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No token found in localStorage");
    }
    const { data } = await axios.get(`${BACKEND_URL}/blog/:id`, {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    return data.post;
  } catch (error) {
    console.error(`Error fetching blog posts: ${error}`);
    return null;
  }
};

export default function Ho() {
  const [blog, setBlog] = useState();

  useEffect(() => {
    (async () => {
      const fetchedBlog = await getBlog();
      if (fetchedBlog !== null) {
        setBlog(fetchedBlog);
      }
    })();
  }, []);

  return <div>{blog}</div>;
}
