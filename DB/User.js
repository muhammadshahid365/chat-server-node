const mongoose = require('mongoose')
const userSchema = require('./userSchema')

mongoose.connect('mongodb://localhost:27017/usersdb',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
);

const db = mongoose.connection
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
  console.log("Connected successfully");
});

const User = mongoose.model('User', userSchema)

module.exports = { User, db }