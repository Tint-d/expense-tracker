const socketMiddleware = (io) => (req, res, next) => {
  try {
    req.io = io;

    req.emitExpenseNotification = (userId, message) => {
      console.log(userId, "in my server");
      io.emit("expenseNotification", {
        userId,
        message,
      });
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = socketMiddleware;
