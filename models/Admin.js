// models/Admin.js
const mongoose = require('mongoose');

const adminSchema = mongoose.Schema({
  fname: String,
  lname: String,
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
});

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
