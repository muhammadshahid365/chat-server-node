const mongoose = require('mongoose')
const { Schema } = mongoose;

const userSchema = new Schema({
  username:  String,
  token: String,
  password: String
});

module.exports = userSchema