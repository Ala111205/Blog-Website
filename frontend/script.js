const el = (qs) => document.querySelector(qs);
const els = (qs) => document.querySelectorAll(qs);

const API_URL = "https://blog-website-nhnr.onrender.com";

let posts = [];
let filteredPosts = [];
let activeCategory = null;
let editingPostId = null;

const currentUser = JSON.parse(localStorage.getItem("user"));
const token = localStorage.getItem("token");

// Escape HTML 
function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function apiFetch(
  path,
  { method = "GET", body, auth = true } = {},
  retries = 3,
  backoff = 800
) {
  const headers = { "Content-Type": "application/json" };

  if (auth) {
    const token = localStorage.getItem("token");
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      // retry ONLY for server errors
      if (res.status >= 500 && retries > 0) {
        await new Promise(r => setTimeout(r, backoff));
        return apiFetch(path, { method, body, auth }, retries - 1, backoff * 2);
      }
      throw new Error(data.message || `HTTP ${res.status}`);
    }

    return data;
  } catch (err) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, backoff));
      return apiFetch(path, { method, body, auth }, retries - 1, backoff * 2);
    }
    throw err;
  }
}

// Handle Login Form
const loginForm = el("#loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = el("#email").value.trim();
    const password = el("#password").value.trim();

    if (!email || !password) {
      alert("Email and password are required", "error");
      return;
    }

    try {
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        auth: false,
        body: { email, password }
      });

      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);

      alert("Logged in successfully");
      window.location.href = "../index.html";

    } catch (err) {
      alert(err.message || "Login failed", "error");
    }
  });
}

// Handle Signup Form
const signupForm = el("#signupForm");
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = el("#name").value.trim();
    const email = el("#email").value.trim();
    const password = el("#password").value.trim();

    if (!name || !email || !password) {
      alert("All fields are required");
      return;
    }

    try {
      await apiFetch("/api/auth/signup", {
        method: "POST",
        auth: false,
        body: { name, email, password }
      });

      alert("Signup successful! Please login.");
      window.location.href = "../authentication/login.html";
    } catch (err) {
      alert(err.message || "Signup failed");
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const authLink = document.getElementById("authLink");

  if (!currentUser || !authLink) return;

  const logoutBtn = document.createElement("button");
  logoutBtn.textContent = "Logout";
  logoutBtn.className = "logout-btn";

  logoutBtn.addEventListener("click", () => {
    // Clear auth state
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    alert("Logged out successfully");

    // Redirect
    window.location.href = "index.html";
  });

  const li = authLink.parentElement;
  li.replaceChild(logoutBtn, authLink);
});


// apiFetch Posts from Backend 
async function loadPosts() {
  const posts = await apiFetch(`/api/posts`);
  filteredPosts = [...posts];
  return posts;
}

// Load Comments
async function loadComments(postId) {
  try {
    return await apiFetch(`/api/comments/${postId}`);
  } catch (err) {
    console.error("Error loading comments:", err);
    return [];
  }
}

// Add Post
async function addPost(post) {
  try {
    const res = await apiFetch(`/api/posts`, {
      method: "POST",
      body: post
    });
    return res;
  } catch (err) {
    console.error("Error adding post:", err);
    alert(`❌ Error: ${err.message}`);
    return null;
  }
}

// Add Comment
async function addComment(comment) {
  try {
    return await apiFetch(`/api/comments`, {
      method: "POST",
      body: comment
    });
  } catch (err) {
    console.error("Error adding comment:", err);
    alert(`❌ Error: ${err.message}`);
    return null;
  }
}

// Update Post
async function updatePost(postId, updatedData) {
  try {
    return await apiFetch(`/api/posts/${postId}`, {
      method: "PUT",
      body: updatedData
    });
  } catch (err) {
    console.error("Error updating post:", err);
    alert(err.message || "Failed to update post");
    return null;
  }
}

// Update Comment
async function updateComment(commentId, updatedData) {
  try {
    return await apiFetch(`/api/comments/${commentId}`, {
      method: "PUT",
      body: updatedData
    });
  } catch (err) {
    console.error("Error updating comment:", err);
    alert(err.message || "Failed to update comment");
    return null;
  }
}

// Delete Post
async function deletePost(postId) {
  try {
    await apiFetch(`/api/posts/${postId}`, { method: "DELETE" });

    posts = await loadPosts();
    filteredPosts = posts;

    renderCategoryList();
    renderPostList(filteredPosts);

    el("#postView").innerHTML =
      "<p>✅ Post deleted successfully.</p>";
  } catch (err) {
    console.error("Error deleting post:", err);
    alert(err.message || "Failed to delete post");
  }
}

// Delete Comment
async function deleteComment(commentId, postId) {
  try {
    await apiFetch(`/api/comments/${commentId}`, {
      method: "DELETE"
    });

    return await loadComments(postId);
  } catch (err) {
    console.error("Error deleting comment:", err);
    alert(err.message || "Failed to delete comment");
    return [];
  }
}

// Post Form
function renderAddPostForm() {
  const currentUser = JSON.parse(localStorage.getItem("user"));
  console.log("Current User: ", currentUser);

  const container = el("#contentArea");
  container.querySelector(".add-post")?.remove();

  if (!currentUser) {
    const msg = document.createElement("p");
    msg.className = "login-message";
    msg.textContent = "🔒 You need to log in before adding a post or comment";
    container.insertAdjacentElement("afterbegin", msg);
    return;
  }

  const section = document.createElement("section");
  section.className = "add-post";

  const h2 = document.createElement("h2");
  h2.textContent = "Add New Post";

  const form = document.createElement("form");
  form.id = "addPostForm";
  form.className = "comment-form";

  const inputTitle = document.createElement("input");
  inputTitle.type = "text";
  inputTitle.id = "postTitle";
  inputTitle.placeholder = "Title";
  inputTitle.required = true;

  const inputDate = document.createElement("input");
  inputDate.type = "date";
  inputDate.id = "postDate";
  inputDate.required = true;

  const inputImage = document.createElement("input");
  inputImage.type = "text";
  inputImage.id = "postImage";
  inputImage.placeholder = "Image URL";

  const inputTags = document.createElement("input");
  inputTags.type = "text";
  inputTags.id = "postTags";
  inputTags.placeholder = "Tags (comma separated)";

  const textareaContent = document.createElement("textarea");
  textareaContent.id = "postContent";
  textareaContent.rows = 5;
  textareaContent.placeholder = "Post content";
  textareaContent.required = true;

  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.className = "small-btn";
  submitBtn.textContent = "Add Post";

  form.append(
    inputTitle,
    inputDate,
    inputImage,
    inputTags,
    textareaContent,
    submitBtn
  );

  section.append(h2, form);
  container.insertAdjacentElement("afterbegin", section);

    form.onsubmit = async (e) => {
      e.preventDefault();
      const title = el("#postTitle").value.trim();
      const date = el("#postDate").value;
      const image = el("#postImage").value.trim() || "https://picsum.photos/seed/new/1200/600";
      const tags = el("#postTags").value.split(",").map(t => t.trim()).filter(Boolean);
      const content = el("#postContent").value.replace(/\r\n/g, "\n").split(/\n{1}/).map(p => p.trim()).filter(Boolean);  
      const token = localStorage.getItem("token");
      console.log("Token: ", token);
      
      if (!title || !date || !content) return alert("Please fill in title, date, and content.");

      if (editingPostId) {
        const updatedPost = { 
          title, 
          date, 
          image, 
          tags, 
          content
        };
        const saved = await updatePost(editingPostId, updatedPost);
        posts = posts.map(p => p._id === editingPostId ? saved : p);
        renderCategoryList();
        renderPostList(posts);
        showPost(saved._id);
        form.reset();
        editingPostId = null;
        submitBtn.textContent = "Add Post";
        alert("✅ Post updated!");
      } else {
        const newPost = { 
          title, 
          date, 
          image, 
          tags, 
          content
        };
        const savedPost = await addPost(newPost);
        if (!savedPost || !savedPost._id) return alert("❌ Failed to add post. Check server logs.");
        posts.unshift(savedPost);
        renderCategoryList();
        renderPostList(posts);
        showPost(savedPost._id);
        form.reset();
        alert("✅ Post added successfully!");
      }
    };
}

function applyFilters() {
  const searchTerm = el("#searchInput").value.trim().toLowerCase();

  filteredPosts = posts.filter(post => {
    const matchesCategory = !activeCategory || post.tags.includes(activeCategory);
    const matchesSearch = !searchTerm || post.title.toLowerCase().includes(searchTerm) || post.content.toLowerCase().includes(searchTerm);
    return matchesCategory && matchesSearch;
  });

  renderPostList(filteredPosts);
}

// Render Categories
function renderCategoryList() {
  const categorySet = new Set();
  posts.forEach(p => p.tags.forEach(t => categorySet.add(t)));
  const categories = Array.from(categorySet).sort();
  const ul = el("#categoryList");
  ul.innerHTML = "";
  categories.forEach(cat => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.textContent = cat;
    btn.addEventListener("click", () => {
      activeCategory = cat;
      document.querySelectorAll("#categoryList button").forEach(b => b.classList.toggle("active", b === btn));
      applyFilters();

      const postList = el("#postList")
      setTimeout(() => {
        const rect = postList.getBoundingClientRect();
        const totalHeight = rect.height + rect.top + window.scrollY;
        window.scrollTo({
          top: totalHeight - window.innerHeight + 50,
          behavior: "smooth",
        });
      }, 100);
    });
    li.appendChild(btn);
    ul.appendChild(li);
  });
}

// Render Post List
function renderPostList(list) {
  const ul = el("#postList");
  ul.innerHTML = "";
  list.forEach(p => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = `#${p._id}`;
    a.innerHTML = `<strong>${p.title}</strong><div class="meta-small">${new Date(p.date).toLocaleDateString()} · ${p.tags.join(", ")}</div>`;
    a.addEventListener("click", (ev) => {
      ev.preventDefault();
      showPost(p._id);
 
      const post = el("#postView").querySelector("header")
      setTimeout(() => {
        const rect = post.getBoundingClientRect();
        const totalHeight = rect.height + rect.top + window.scrollY;
        window.scrollTo({
          top: totalHeight - window.innerHeight + 50,
          behavior: "smooth",
        });
      }, 100);
    });
    li.appendChild(a);
    ul.appendChild(li);
  });
}

// Show Single Post
async function showPost(id) {
  const currentUser = JSON.parse(localStorage.getItem("user"));

  const post = posts.find(p => p._id === id);
  if (!post) return;

  const article = el("#postView");
  article.innerHTML = "";

  // Post Header
  const header = document.createElement("header");

  const h1 = document.createElement("h1");
  h1.textContent = post.title;

  const postMeta = document.createElement("div");
  postMeta.className = "post-meta";

  const timeEl = document.createElement("time");
  timeEl.dateTime = post.date;
  timeEl.textContent = new Date(post.date).toLocaleDateString();

  const actionsDiv = document.createElement("div");
  actionsDiv.className = "post-actions";

  if (currentUser && post.userId === currentUser._id) {
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "small-btn";
    deleteBtn.textContent = "🗑 Delete Post";
    deleteBtn.addEventListener("click", () => {
      if (!confirm("Delete this post?")) return;
      deletePost(id);
    });

    const editBtn = document.createElement("button");
    editBtn.className = "small-btn";
    editBtn.textContent = "✏️ Edit Post";
    
    editBtn.addEventListener("click", () => {
      el("#postTitle").value = post.title;
      el("#postDate").value = post.date.split("T")[0];
      el("#postImage").value = post.image;
      el("#postTags").value = post.tags.join(", ");
      el("#postContent").value = post.content.join("\n\n");

      editingPostId = post._id;

      const submitBtn = document.querySelector("#addPostForm button[type='submit']");
      if (submitBtn) submitBtn.textContent = "Update Post";

      const form = el("#addPostForm")
      setTimeout(() => {
        const rect = form.getBoundingClientRect();
        const totalHeight = rect.height + rect.top + window.scrollY;
        window.scrollTo({
          top: totalHeight - window.innerHeight + 50,
          behavior: "smooth",
        });
      }, 100);
    });

    actionsDiv.append(deleteBtn, editBtn);
  }

  postMeta.append(timeEl, actionsDiv);

  const imgEl = document.createElement("img");
  imgEl.className = "post-image";
  imgEl.src = post.image;
  imgEl.alt = `Image for ${post.title}`;

  const contentDiv = document.createElement("div");
  contentDiv.className = "post-content";

  post.content.forEach(paragraph => {
    const p = document.createElement("p");
    p.textContent = paragraph;
    contentDiv.appendChild(p);
  });

  article.appendChild(contentDiv);


  const tagsDiv = document.createElement("div");
  tagsDiv.className = "post-tags";
  post.tags.forEach(tag => {
    const span = document.createElement("span");
    span.className = "tag";
    span.textContent = tag;
    tagsDiv.appendChild(span);
  });

  header.append(h1, postMeta, imgEl, contentDiv, tagsDiv);
  article.appendChild(header);

  // Comments Section
  const commentsSection = document.createElement("section");
  commentsSection.className = "comments";
  commentsSection.id = "commentsSection";

  let commentForm, inputName, textarea, submitBtnComment;
  if (currentUser) {
    const h3 = document.createElement("h3");
    h3.textContent = "Comments";

    commentForm = document.createElement("form");
    commentForm.id = "commentForm";
    commentForm.className = "comment-form";

    inputName = document.createElement("input");
    inputName.type = "text";
    inputName.id = "commentName";
    inputName.placeholder = "Your name";
    inputName.required = true;

    textarea = document.createElement("textarea");
    textarea.id = "commentText";
    textarea.rows = 3;
    textarea.placeholder = "Your comment";
    textarea.required = true;

    submitBtnComment = document.createElement("button");
    submitBtnComment.type = "submit";
    submitBtnComment.className = "small-btn";
    submitBtnComment.textContent = "Post Comment";

    commentForm.append(inputName, textarea, submitBtnComment);
    commentsSection.append(h3, commentForm);
  }

  const commentListDiv = document.createElement("div");
  commentListDiv.id = "commentList";
  commentsSection.appendChild(commentListDiv);
  article.appendChild(commentsSection);

  // Load and Render Comments
  let comments = await loadComments(post._id);
  let editingCommentId = null;

  function renderComments() {
    commentListDiv.innerHTML = "";
    if (comments.length === 0) {
      const p = document.createElement("p");
      p.textContent = "No comments yet.";
      commentListDiv.appendChild(p);
      return;
    }

    comments.slice().reverse().forEach(c => {
      const commentDiv = document.createElement("div");
      commentDiv.className = "comment";

      const whoDiv = document.createElement("div");
      whoDiv.className = "who";
      whoDiv.textContent = c.name;

      const whenDiv = document.createElement("div");
      whenDiv.className = "when";
      whenDiv.textContent = new Date(c.when).toLocaleString();

      const whatDiv = document.createElement("div");
      whatDiv.className = "what";
      whatDiv.textContent = c.message;

      const actionsDiv = document.createElement("div");
      actionsDiv.className = "post-actions";

      if (currentUser && c.userId === currentUser._id) {
        const editBtn = document.createElement("button");
        editBtn.className = "small-btn";
        editBtn.textContent = "✏️";
        editBtn.addEventListener("click", () => {
          inputName.value = c.name;
          textarea.value = c.message;
          editingCommentId = c._id;
          submitBtnComment.textContent = "Update Comment";

          setTimeout(() => {
            const rect = commentForm.getBoundingClientRect();
            const totalHeight = rect.height + rect.top + window.scrollY;
            window.scrollTo({
              top: totalHeight - window.innerHeight + 50,
              behavior: "smooth",
            });
          }, 100);
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "small-btn";
        deleteBtn.textContent = "🗑";
        deleteBtn.addEventListener("click", async () => {
          comments = await deleteComment(c._id, post._id);
          renderComments();
        });

        addLongPress(commentDiv, async () => {
          if (!confirm("Delete this comment?")) return;
          comments = await deleteComment(c._id, post._id);
          renderComments();
        });

        actionsDiv.append(deleteBtn, editBtn);
      }

      commentDiv.append(actionsDiv, whoDiv, whenDiv, whatDiv);
      commentListDiv.appendChild(commentDiv);
    });
  }

  renderComments();

  if (commentForm) {
    commentForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = inputName.value.trim();
      const message = textarea.value.trim();
      if (!name || !message) return alert("Enter both name and comment");

      if (editingCommentId) {
        const updated = await updateComment(editingCommentId, { name, message });
        if (updated) {
          comments = await loadComments(post._id);
          renderComments();
          commentForm.reset();
          editingCommentId = null;
          submitBtnComment.textContent = "Post Comment";
        }
      } else {
        await addComment({ postId: post._id, name, message });
        comments = await loadComments(post._id);
        renderComments();
        commentForm.reset();
      }
    });
  }
}

// Long Press Utility
function addLongPress(element, callback, duration = 800) {
  let timer;

  const start = () => {
    element.style.backgroundColor = "#ffcdd2";
    timer = setTimeout(() => {
      callback();
      element.style.backgroundColor = "";
    }, duration);
  };

  const end = () => {
    clearTimeout(timer);
    element.style.backgroundColor = "";
  };

  element.addEventListener("mousedown", start);
  element.addEventListener("touchstart", start);
  element.addEventListener("mouseup", end);
  element.addEventListener("mouseleave", end);
  element.addEventListener("touchend", end);
  element.addEventListener("touchcancel", end);
}

// Initialization
async function init() {
  const yearEl = el("#year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  await loadPosts();
  renderAddPostForm();
  renderCategoryList();
  renderPostList(posts);

  if (posts.length > 0) showPost(posts[0]._id);

  // Search input debounce
  let t;
  el("#searchInput").addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(applyFilters, 180);
  });

  el("#clearFilter").addEventListener("click", () => {
    activeCategory = null;
    el("#searchInput").value = "";
    applyFilters();
  });
}

document.addEventListener("DOMContentLoaded", init);
