"use client";
import axios from "axios";
import { useEffect, useState } from "react";
const BACKEND_URL = process.env.BACKEND_URL;

const getBlogs = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No token found in localStorage");
    }
    const { data } = await axios.get(`${BACKEND_URL}/blog/bulk`, {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    return data.posts;
  } catch (error) {
    console.error(`Error fetching blog posts: ${error}`);
    return null;
  }
};

export default function Ho() {
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    (async () => {
      const fetchedBlogs = await getBlogs();
      if (fetchedBlogs !== null) {
        setBlogs(fetchedBlogs);
      }
    })();
  }, []);

  return <div>{blogs}</div>;
}
