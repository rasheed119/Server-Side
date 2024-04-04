import express from "express";
import cors from "cors";
import { adminRouter } from "./Routes/AdminRoute.js";
import { EmployeeRouter } from "./Routes/EmployeeRoute.js";
import Jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerui from "swagger-ui-express";

dotenv.config();

const app = express();
app.use(
  cors({
    origin: ["http://localhost:5173", "https://front-end-beta-bice.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use("/auth", adminRouter);
app.use("/employee", EmployeeRouter);
app.use(express.static("Public"));

const verifyUser = (req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    Jwt.verify(token, "jwt_secret_key", (err, decoded) => {
      if (err) return res.json({ Status: false, Error: "Wrong Token" });
      req.id = decoded.id;
      req.role = decoded.role;
      req.email = decoded.email;
      next();
    });
  } else {
    return res.json({ Status: false, Error: "Not autheticated" });
  }
};

app.get("/verify", verifyUser, (req, res) => {
  return res.json({
    Status: true,
    id: req.id,
    role: req.role,
    email: req.email,
  });
});

const spaces = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Employee Management System API",
      version: "1.0.0",
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
  },
  apis: ["./Routes/*.js"],
});
app.use("/api-docs", swaggerui.serve, swaggerui.setup(spaces));

app.listen(3000, () => {
  console.log("Server is running");
});
export default verifyUser;
