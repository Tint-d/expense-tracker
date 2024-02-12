require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const socketIo = require("socket.io");
const { connectDB, getDB } = require("./db/db");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const authRouter = require("./routes/authRoute");
const expenseRouter = require("./routes/expenseRoute");
const incomeRouter = require("./routes/incomeRoute");
const socketMiddleware = require("./middleware/socketMiddleware");
const budgetRouter = require("./routes/budgetRoute");
const recurringRouter = require("./routes/recurringRoute");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  path: "/api/v1/expense/socket.io",
  serveClient: false,
});

const port = 5000;

connectDB()
  .then(() => {
    app.use(express.json());
    app.use(cors());
    app.use(socketMiddleware(io));

    io.on("connection", (socket) => {
      console.log("User connected:", socket.id);
      const userId = socket.handshake.query.userId;
      console.log(userId, "userID in my server.js");
      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
      });
    });

    app.use("/api/v1/user", authRouter);
    app.use("/api/v1/expense", expenseRouter);
    app.use("/api/v1/income", incomeRouter);
    app.use("/api/v1/budget", budgetRouter);
    app.use("/api/v1/recurring", recurringRouter);

    app.use(notFound);
    app.use(errorHandler);

    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((err) => {
    console.log(err, "Connecting error");
  });
