require("dotenv").config();
const express = require("express");
const { getDB } = require("../db/db");
const { tryCatch } = require("../utils/tryCatch");
const { BadRequest, NotFound } = require("../utils/AppError");
const { ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");

exports.register = tryCatch(async (req, res) => {
  const db = getDB();
  const collection = db.collection("user");

  const users = await collection.find({}).toArray();
  const { name, email, password, password_confirmation } = req.body;
  const existUser = users.find((user) => user.email === email);
  if (existUser) {
    throw new BadRequest("Email have been already exist!");
  }
  if (password !== password_confirmation) {
    throw new BadRequest("Password and Password_confirmation must be same!");
  }

  const hashPassword = bcrypt.hashSync(password, 10);

  const newUser = {
    name,
    email,
    password: hashPassword,
    password_confirmation,
  };

  const result = await collection.insertOne(newUser);
  res.status(200).json({ message: "Register Successfully", data: result });
});

// login =>

exports.login = tryCatch(async (req, res) => {
  const db = getDB();
  const collection = db.collection("user");

  const users = await collection.find({}).toArray();
  const { email, password } = req.body;
  const existUser = users.find((user) => user.email === email);
  if (!existUser || !bcrypt.compareSync(password, existUser.password)) {
    throw new BadRequest("Invaild credentials");
  }
  const token = generateToken(existUser._id);

  res.status(200).json({ message: "Login Sucessfully", token });
});

exports.logout = tryCatch(async (req, res) => {
  const userId = req.userId;
  res.status(200).json({ message: "Logout Sucessfully" });
});

exports.getUsers = tryCatch(async (req, res) => {
  const db = getDB();
  const collection = db.collection("user");
  const userId = req.userId;

  const users = await collection.find({}).toArray();
  res.status(200).json({ message: true, user: users });
});

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECERT);
};
