**📝 Full-Stack Blog Website**

      A modern full-stack Blog Website allowing users to register, login, add, edit, and delete posts, with tags, images, and content formatting — featuring authentication, role-based post management, keyword search, and a responsive, interactive UI.

**Repository Link:-** https://blog-website-nine-lake.vercel.app/

**🚀 Features:-**

**🔹 Core Blog Features**

        🏠 Home page with latest posts sorted by creation date

        ✍️ Add new blog posts with title, date, image, tags, and content

        🖊️ Edit or delete posts for the authenticated user who created them

        📄 View full post content on separate post page

        📌 Tag-based categorization for filtering posts

        🔍 Real-time keyword search across post titles and content

        🔒 Login & Signup with JWT authentication

        🚪 Logout functionality with localStorage cleanup

**🔹 Search & Filter Features**

        🔎 Live search field to find posts by typing keywords

        🧠 Searches match:

            Post title

            Post content (all paragraphs)

        🧹 Clear filter option to reset search results instantly

        🔁 Users can search again immediately after clearing without page reload

**🔹 Additional Features**

        🌐 Responsive navigation bar with Home, Login, Logout, About, Contact links

        🖼️ Default image fallback for posts if no image is provided

        📝 Rich text content support with paragraph separation

        ⚡ Smooth scrolling to add/edit post form

        ✅ User validation: Only logged-in users can add, edit, or delete their posts

**⚙️ Tech Stack:-**

**🖥️ Frontend**

      HTML5 & CSS3 – responsive and modern layout

      JavaScript (ES6 Modules) – modularized code for maintainability

      DOM manipulation & event handling – dynamic rendering of posts and forms

      LocalStorage – stores user data and JWT token for session persistence

**🧠 Backend**

      Node.js + Express.js – RESTful API for user authentication and posts management

      MongoDB + Mongoose – stores users, posts, and tags

      JWT Authentication – secure login and protected routes

      dotenv – environment variable management

      CORS – cross-origin API handling
