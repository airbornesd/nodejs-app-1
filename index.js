import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const app = express();
const PORT = 9000;

// connecting database
mongoose
  .connect(
    "<-create using mongodb atlas, connect, paste here->",
    {
      dbName: "backend",
    }
  )
  .then(() => {
    console.log("Database Connected");
  })
  .catch((err) => {
    console.log(err);
  });

// schema for db
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

const User = mongoose.model("User", userSchema);

// middleware
app.use("/public", express.static(path.join(path.resolve(), "public")));
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(cookieParser());

// auth middleware function
const isAuthenticated = async (req, res, next) => {
  const { token } = req.cookies;

  if (token) {
    const decoded = jwt.verify(token, "asdawdqd23wdasda");
    req.user = await User.findById(decoded._id);
    next();
  } else {
    res.redirect("login");
  }
};

// setting view engine
app.set("view engine", "ejs");

// routes
app.get("/", isAuthenticated, (req, res) => {
  console.log(req.user);
  res.render("logout", { name: req.user.name });
});

// registers redirect
app.get("/register", (req, res) => {
  res.render("register");
});

// register post
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  let user = await User.findOne({ email });
  if (user) {
    return res.redirect("/login");
  }

  const hashPassword = await bcrypt.hash(password, 10);

  user = await User.create({
    name: name,
    email: email,
    password: hashPassword,
  });

  const token = jwt.sign(
    {
      _id: user._id,
    },
    "asdawdqd23wdasda"
  );

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  res.redirect("/");
});

// login redirect
app.get("/login", (req, res) => {
  res.render("login");
});

// login post
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  let user = await User.findOne({ email });

  if (!user) return res.redirect("/register");

  // const isPasswordMatch = user.password === password;
  const isPasswordMatch = await bcrypt.compare(password, user.password)
  if (!isPasswordMatch)
    return res.render("login", { message: "Incorrect Password!" });

  const token = jwt.sign(
    {
      _id: user._id,
    },
    "asdawdqd23wdasda"
  );

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  res.redirect("/");
});

// logout
app.post("/logout", async (req, res) => {
  res.cookie("token", null, {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.redirect("/");
});

// server listen
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
