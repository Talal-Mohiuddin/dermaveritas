document.addEventListener("DOMContentLoaded", async () => {
  // Function to get cookie by name
  async function getTokenFromServer() {
    try {
      const response = await fetch("https://dermaveritas.com/api/get-session", {
        method: "GET",
        credentials: "include", // Send cookies with the request
        headers: {
          "Content-Type": "application/json",
        },
      });
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
        "https://dermaveritas.com/api/verify-token",
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

  // Function to handle redirects based on role and current page
  function handleRedirect(role, isValid) {
    const currentPath = window.location.pathname;
    const adminRoutes = [
      "/dashboard.html",
      "/addproduct.html",
      "/addblog.html",
      "/editblog.html",
      "/editproduct.html",
      "/orders.html",
      "/manageblogs.html",
      "/manageproducts.html",
    ]; // Admin-only routes
    const loginPage = "/login.html";

    if (!isValid) {
      // If token is invalid, redirect to login
      if (currentPath !== loginPage) {
        window.location.href = loginPage;
      }
      return;
    }

    // For admin-only routes, check if user is admin
    if (adminRoutes.includes(currentPath)) {
      if (role !== "admin") {
        // Non-admin users are redirected to login
        window.location.href = loginPage;
      }
      return;
    }

    // If user is on login page and authenticated, redirect based on role
    if (currentPath === loginPage && isValid) {
      window.location.href = role === "admin" ? "/dashboard.html" : "/";
    }
  }

  // Main authentication logic
  async function checkAuth() {
    const token = await getTokenFromServer();
    if (!token) {
      // No token found, redirect to login
      handleRedirect(null, false);
      return;
    }

    // Verify the token
    const { isValid, role } = await verifyToken(token);
    handleRedirect(role, isValid);
  }

  // Run authentication check
  await checkAuth();
});
