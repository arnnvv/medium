import axios from "axios";
import { useEffect, useState } from "react";
const BACKEND_URL = process.env.BACKENDURL;

export interface Post {
  content: string;
  title: string;
  id: number;
  author: {
    name: string;
  };
}

export const usePost = (id: number) => {
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<Post>();
  useEffect(() => {
    (async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/blog/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setPost(response.data.post);
        setLoading(false);
      } catch (e) {
        console.error(`Error in fetching post: ${e}`);
      }
    })();
  }, [id]);

  return {
    loading,
    post,
  };
};

export const usePosts = () => {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>();
  useEffect(() => {
    (async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/blog/bulk`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setPosts(response.data.posts);
        setLoading(false);
      } catch (e) {
        console.error(`Error in fetching posts: ${e}`);
      }
    })();
  });
  return {
    loading,
    posts,
  };
};
