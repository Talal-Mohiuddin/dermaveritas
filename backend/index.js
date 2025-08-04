import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import connectDB from "./utils/connectdb.js";
import Userrouter from "./routes/user-route.js";
import Cartrouter from "./routes/cart-route.js";
import Productrouter from "./routes/product-route.js";
import Blogrouter from "./routes/blog-route.js";
import Orderrouter from "./routes/order-route.js";
import VerifyTokenRouter from "./routes/verifyToken-route.js";
import cookieParser from "cookie-parser";
import { handleStripeWebhook } from "./controllers/stripe.js";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: [process.env.FRONTEND_URL, "http://localhost:3000"],
    credentials: true,
  })
);

// Stripe webhook route MUST come before body parsing middleware
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

// Body parsing middleware (after webhook route)
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files from public directory
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

const frontendPath = path.join(__dirname, "../frontend");

// GTM Container ID
const gtmId = "GTM-PMLS38CB";

// GTM snippets
const headSnippet = `
  <!-- Google Tag Manager -->
  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','${gtmId}');</script>
  <!-- End Google Tag Manager -->
`;

const bodySnippet = `
  <!-- Google Tag Manager (noscript) -->
  <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}"
  height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
  <!-- End Google Tag Manager (noscript) -->
`;

// Middleware to inject GTM code
app.use((req, res, next) => {
  const isHtmlRequest = req.path.endsWith(".html") || req.path === "/";
  if (isHtmlRequest) {
    console.log(`Processing HTML file: ${req.path}`);
    const filePath = path.join(
      frontendPath,
      req.path === "/" ? "index.html" : req.path
    );
    if (fs.existsSync(filePath)) {
      fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
          return next(err); // Propagate error to error middleware
        }

        // Inject GTM snippets into the HTML
        let modifiedData = data.replace("</head>", `${headSnippet}</head>`);
        modifiedData = modifiedData.replace("<body>", `<body>${bodySnippet}`);

        res.send(modifiedData); // Send modified HTML
      });
    } else {
      next(); // Proceed to next middleware if file doesn't exist
    }
  } else {
    next(); // Proceed to next middleware for non-HTML requests
  }
});

// API routes (before static files)
app.use("/api/users", Userrouter);
app.use("/api/cart", Cartrouter);
app.use("/api/products", Productrouter);
app.use("/api/blog", Blogrouter);
app.use("/api/orders", Orderrouter);
app.use("/api", VerifyTokenRouter);

// Serve static files (after API routes)
app.use(express.static(frontendPath));

// Single route for index.html fallback
app.get(/^\/(?!api).*/, (req, res) => {
  // The GTM injection is now handled by the middleware for "/"
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.use(errorMiddleware);
export default app;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
