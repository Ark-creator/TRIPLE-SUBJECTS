const Admin = require('../models/Admin');
const bcryptjs = require('bcryptjs');

class AdminAuth {
  async login(params) {
    let admin;
    
    if (params.email && params.password) {
      // Find admin by email
      admin = await Admin.findOne({ email: params.email });
    }

    if (admin && await bcryptjs.compare(params.password, admin.password)) {
      // Login success
      return true;
    } 
    
    // Login failure
    return false;
  }
}

const adminAuth = new AdminAuth();

module.exports = adminAuth;
