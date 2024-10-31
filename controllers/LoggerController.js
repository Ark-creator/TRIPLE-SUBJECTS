const User = require('../models/User');
const Token = require('../models/Token'); // Token model for storing verification tokens
const route = require('express').Router();
const bcryptjs = require('bcryptjs');
const crypto = require('crypto'); // For generating token
const nodemailer = require('nodemailer'); // For sending email
const mongoose = require('mongoose'); // Ensure mongoose is imported


class Register {  
  async register(params, req) {
    let unique;

    // Check if not empty
    if (params.fname || params.lname || params.email || params.password) {
      unique = await User.find({ email: params.email });
    }

    // Check if email already exists
    if (unique.length > 0) {
      return false;
    }

    // Hash the password
    const salt = await bcryptjs.genSalt();
    const hashed = await bcryptjs.hash(params.password, salt);

    // Create the new user with a `isVerified` flag
    const user = await User.create({
      fname: params.fname,
      lname: params.lname,
      email: params.email,
      password: hashed,
      isVerified: false, // Email verification status
    });

    // Generate a verification token
    const token = crypto.randomBytes(32).toString('hex');
    await Token.create({
      userId: user._id,
      token: token,
      createdAt: Date.now(),
    });

    // Send the verification email
    const verificationLink = `http://${req.headers.host}/ark/verify-email/${user._id}/${token}`;
    await this.sendVerificationEmail(user.email, verificationLink);

    return true; // Return true for successful registration
  }

  // Send the verification email function
  async sendVerificationEmail(email, link) {
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'arkvisionsmoments@gmail.com', // Replace with your email
        pass: 'xwmu toeh mxji gket', // Replace with your email password
      },
    });

    const mailOptions = {
      from: 'Ark Visions <arkvisionsmoments@gmail.com>', // Replace with your email
      to: email,
      subject: 'Email Verification - Ark Visions',
      html: `
        <h1>Email Verification</h1>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${link}">Verify Email</a>
      `,
    };

    await transporter.sendMail(mailOptions);
  }

  // Verify the user's email


// Verify the user's email
async verifyEmail(userId, token) {
  const tokenRecord = await Token.findOne({ userId: userId, token: token });

  if (!tokenRecord) {
    console.log('Invalid or expired token');
    return { success: false, message: 'Invalid or expired token.' };
  }

  // Convert userId to ObjectId
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Mark user as verified
  const updatedUser = await User.updateOne(
    { _id: userObjectId },
    { $set: { isVerified: true } }
  );

  // Check if the update was acknowledged and at least one document matched
  if (updatedUser.acknowledged && updatedUser.matchedCount > 0) {
    console.log('User verified successfully');
    // Remove the token once verified
    await Token.deleteOne({ _id: tokenRecord._id });
    return { success: true, message: 'Email successfully verified!' };
  } else {
    console.log('Failed to verify the user');
    return { success: false, message: 'Failed to verify the user.' };
  }
}


async login(params) {
  // Ensure both email and password are provided
  if (!params.email || !params.password) {
    console.log('Email or password missing.');
    return 'missing_fields'; // Fail if any field is missing
  }

  // Find the user by email
  const user = await User.findOne({ email: params.email });

  // If the user exists
  if (user) {
    console.log('User found:', user.email);
    console.log('Stored hashed password:', user.password);

    // Compare the password entered with the hashed password
    const compare = await bcryptjs.compare(params.password, user.password);

    if (compare) {
      if (user.isVerified) {
        console.log('Login successful');
        return 'login_success'; // Login successful
      } else {
        console.log('User not verified');
        return 'not_verified'; // User not verified
      }
    } else {
      console.log('Password comparison failed');
      return 'incorrect_password'; // Incorrect password
    }
  } else {
    console.log('User not found');
    return 'user_not_found'; // User does not exist
  }
} 
}

const register = new Register();

module.exports = register;
