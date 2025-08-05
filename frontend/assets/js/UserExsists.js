document.addEventListener("DOMContentLoaded", async () => {
  // Function to get token from server
  async function getTokenFromServer() {
    try {
      const response = await fetch(
        "https://dermaveritas.onrender.com/api/get-session",
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        return data.token || null;
      }
      return null;
    } catch (error) {
      console.error("Error getting session:", error);
      return null;
    }
  }

  // Function to verify JWT with the backend
  async function verifyToken(token) {
    try {
      const response = await fetch(
        "https://dermaveritas.onrender.com/api/verify-token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        console.error(
          "Token verification failed with status:",
          response.status
        );
        return { isValid: false, role: null };
      }

      const data = await response.json();

      if (data.success) {
        return { isValid: true, role: data.user.role };
      }
      return { isValid: false, role: null };
    } catch (error) {
      console.error("Error verifying token:", error);
      return { isValid: false, role: null };
    }
  }

  // Function to check if user is logged in and update navigation
  async function checkUserExists() {
    const token = await getTokenFromServer();
    const mainMenuBox = document.querySelector(".main-menu-two__main-menu-box");
    const mobileNavContainer = document.querySelector(".mobile-nav__container");
    const searchCartBox = document.querySelector(
      ".main-menu-two__search-cart-box"
    );

    if (!mainMenuBox || !searchCartBox) {
      console.error("Main menu or search-cart box not found");
      return;
    }

    // Function to create user icon element
    function createUserIcon(role) {
      const div = document.createElement("div");
      div.className = "main-menu-two__user-box";
      div.innerHTML = `
        <a href="#" class="main-menu-two__user" aria-label="User Account">
          <i class="fas fa-user"></i>
        </a>
        <ul class="user-dropdown" style="
          display: none;
          position: absolute;
          background: white;
          border-radius: 10px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.2);
          padding: 10px 0;
          min-width: 150px;
          z-index: 1000;
          right: 0;
          top: 40px;
        ">
          <li><a href="settings.html" style="display: block; padding: 10px 20px; color: #1a1a1a; font-family: 'Manrope', sans-serif;">Settings</a></li>
          ${
            role === "admin"
              ? '<li><a href="admin.html" style="display: block; padding: 10px 20px; color: #1a1a1a; font-family: \'Manrope\', sans-serif;">Admin Dashboard</a></li>'
              : ""
          }
          <li><a href="#" id="logout" style="display: block; padding: 10px 20px; color: #1a1a1a; font-family: 'Manrope', sans-serif;">Logout</a></li>
        </ul>
      `;
      return div;
    }

    // Function to create login button element
    function createLoginButton() {
      const div = document.createElement("div");
      div.className = "main-menu-two__login-box";
      div.innerHTML = `
        <a href="login.html" class="main-menu-two__login" aria-label="Login">
          <i class="fas fa-sign-in-alt"></i>
        </a>
      `;
      return div;
    }

    // Function to create cart icon element
    function createCartIcon() {
      const div = document.createElement("div");
      div.className = "main-menu-two__cart-box";
      div.innerHTML = `
        <a href="addtocart.html" class="main-menu-two__cart" aria-label="Cart">
          <i class="fas fa-shopping-cart"></i>
        </a>
      `;
      return div;
    }

    // Function to create search icon element
    function createSearchIcon() {
      const div = document.createElement("div");
      div.className = "main-menu-two__search-box";
      div.innerHTML = `
        <a href="#" class="main-menu-two__search search-toggler" aria-label="Search">
          <i class="fas fa-search"></i>
        </a>
      `;
      return div;
    }

    // Function to update desktop navigation
    function updateDesktopNav(isAuthenticated, role) {
      // Clear all existing icons in search-cart-box to prevent duplicates
      searchCartBox.innerHTML = "";

      // Add search icon
      searchCartBox.appendChild(createSearchIcon());

      if (isAuthenticated) {
        // Add cart icon
        searchCartBox.appendChild(createCartIcon());

        // Add user icon with dropdown
        const userBox = createUserIcon(role);
        searchCartBox.appendChild(userBox);

        // Add dropdown toggle functionality
        const userIcon = userBox.querySelector(".main-menu-two__user");
        const userDropdown = userBox.querySelector(".user-dropdown");
        userIcon.addEventListener("click", (e) => {
          e.preventDefault();
          userDropdown.style.display =
            userDropdown.style.display === "none" ? "block" : "none";
        });

        // Close dropdown when clicking outside
        document.addEventListener("click", (e) => {
          if (
            !userIcon.contains(e.target) &&
            !userDropdown.contains(e.target)
          ) {
            userDropdown.style.display = "none";
          }
        });
      } else {
        // Add login button
        searchCartBox.appendChild(createLoginButton());
      }

      // Add spacing and white icon styles, override ::before
      const style = document.createElement("style");
      style.textContent = `
        .main-menu-two__search-cart-box {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .main-menu-two__user-box,
        .main-menu-two__login-box,
        .main-menu-two__cart-box,
        .main-menu-two__search-box {
          display: flex;
          align-items: center;
        }
        .main-menu-two__user,
        .main-menu-two__login,
        .main-menu-two__cart,
        .main-menu-two__search {
          font-size: 18px;
          color: #ffffff;
          transition: color 0.3s ease;
        }
        .main-menu-two__user::before,
        .main-menu-two__login::before,
        .main-menu-two__cart::before,
        .main-menu-two__search::before {
          content: none !important;
        }
        .main-menu-two__user:hover,
        .main-menu-two__login:hover,
        .main-menu-two__cart:hover,
        .main-menu-two__search:hover {
          color: #ff6b6b;
        }
        .user-dropdown li a:hover {
          background: #f8f8f8;
        }
      `;
      document.head.appendChild(style);
    }

    // Function to update mobile navigation
    function updateMobileNav(isAuthenticated, role) {
      if (!mobileNavContainer) return;

      const existingUserMenu = mobileNavContainer.querySelector(".user-menu");
      const existingLogin = mobileNavContainer.querySelector(
        "a[href='login.html']"
      );

      if (isAuthenticated) {
        if (existingLogin) {
          existingLogin.parentElement.remove();
        }
        if (!existingUserMenu) {
          const li = document.createElement("li");
          li.className = "mobile-nav__item user-menu";
          li.innerHTML = `
            <a href="#" class="mobile-nav__user" style="color: #ffffff;"><i class="fas fa-user" style="color: #ffffff;"></i> ${
              role === "admin" ? "Admin" : "My Account"
            }</a>
            <ul>
              <li><a href="settings.html">Settings</a></li>
              ${
                role === "admin"
                  ? '<li><a href="admin.html">Admin Dashboard</a></li>'
                  : ""
              }
              <li><a href="#" id="mobile-logout">Logout</a></li>
            </ul>
          `;
          mobileNavContainer.appendChild(li);
        }
      } else {
        if (existingUserMenu) {
          existingUserMenu.remove();
        }
        if (!existingLogin) {
          const li = document.createElement("li");
          li.className = "mobile-nav__item";
          li.innerHTML = `<a href="login.html" style="color: #ffffff;"><i class="fas fa-sign-in-alt" style="color: #ffffff;"></i> Login</a>`;
          mobileNavContainer.appendChild(li);
        }
      }
    }

    // Logout handler
    async function handleLogout() {
      try {
        const response = await fetch(
          "https://dermaveritas.onrender.com/api/users/logout",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
          }
        );
        if (response.ok) {
          localStorage.removeItem("jwt");
          window.location.href = "login.html";
        } else {
          console.error("Logout failed");
        }
      } catch (error) {
        console.error("Error during logout:", error);
      }
    }

    if (token) {
      const { isValid, role } = await verifyToken(token);
      if (isValid) {
        localStorage.setItem("jwt", token);
        updateDesktopNav(true, role);
        updateMobileNav(true, role);

        // Attach logout event listeners
        const logoutButton = document.getElementById("logout");
        if (logoutButton) {
          logoutButton.addEventListener("click", (e) => {
            e.preventDefault();
            handleLogout();
          });
        }
        const mobileLogoutButton = document.getElementById("mobile-logout");
        if (mobileLogoutButton) {
          mobileLogoutButton.addEventListener("click", (e) => {
            e.preventDefault();
            handleLogout();
          });
        }
      } else {
        localStorage.removeItem("jwt");
        updateDesktopNav(false, null);
        updateMobileNav(false, null);
      }
    } else {
      updateDesktopNav(false, null);
      updateMobileNav(false, null);
    }
  }

  // Execute check
  await checkUserExists();
});
