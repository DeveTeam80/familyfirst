// src/lib/api-posts.ts

export async function createPost(data: {
  content: string;
  tags: string[];
  imageUrls?: string[];
  eventDate?: string;
}) {
  const response = await fetch("/api/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to create post");
  }

  return response.json();
}

// ⭐ Updated with pagination parameters
export async function fetchPosts(page: number = 1, limit: number = 5) {
  const response = await fetch(`/api/posts?page=${page}&limit=${limit}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch posts");
  }

  return response.json();
}

export async function toggleLike(postId: string) {
  const response = await fetch(`/api/posts/${postId}/like`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to toggle like");
  }

  return response.json();
}

export async function addCommentApi(postId: string, content: string) {
  const response = await fetch(`/api/posts/${postId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: content }),
  });

  if (!response.ok) {
    throw new Error("Failed to add comment");
  }

  return response.json();
}

export async function updatePostApi(postId: string, data: {
  content?: string;
  tags?: string[];
  imageUrls?: string[];
  eventDate?: string;
}) {
  const response = await fetch(`/api/posts/${postId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to update post");
  }

  return response.json();
}

export async function deletePostApi(postId: string) {
  const response = await fetch(`/api/posts/${postId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete post");
  }

  return response.json();
}