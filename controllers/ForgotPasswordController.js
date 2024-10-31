const User = require('../models/User');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcryptjs = require('bcryptjs');

// Generates random token for reset password
const generateToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Mailer function
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'arkvisionsmoments@gmail.com',
        pass: 'xwmu toeh mxji gket', // Use your app-specific password if 2FA is enabled
    },
});

// Request a password reset link
exports.requestReset = async (req, res) => {
    const { email } = req.body;
    
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.render('general/forgot-password', { error: 'No user found with that email!' });
        }

        const token = generateToken();
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 36000000000; // Token expires in 1 hour
        await user.save();

        // Send email
        const mailOptions = {
            to: user.email,
            from: 'arkvisionsmoments@gmail.com',
            subject: 'Password Reset Request',
            text: `You are receiving this email because you requested a password reset.\n\n
                   Click the following link to reset your password:\n\n
                   http://localhost:6969/ark/forgot/reset?token=${token}\n\n
                   If you did not request this, please ignore this email.\n`
        };
        await transporter.sendMail(mailOptions);

        res.render('general/forgot-password', { success: 'An email has been sent with further instructions.' });
    } catch (err) {
        console.error(err);
        res.render('general/forgot-password', { error: 'Error occurred while processing the request.' });
    }
};

// Reset password form (via the link)
exports.resetPasswordForm = async (req, res) => {
    const { token } = req.query;
    
    try {
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.render('general/email-verification', { error: 'Password reset token is invalid or has expired.' });
        }

        res.render('general/new-password', { token });
    } catch (err) {
        console.error(err);
        res.render('general/email-verification', { error: 'Error loading the reset password form.' });
    }
};

// Update password
exports.updatePassword = async (req, res) => {
    const { password, confirmPassword, token } = req.body;

    try {
        // Find the user based on the token and check expiration
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.render('general/new-password', { token, error: 'Password reset token is invalid or has expired.' });
        }

        // Check if passwords match
        if (password !== confirmPassword) {
            return res.render('general/new-password', { token, error: 'Passwords do not match.' });
        }

        // Hash the new password
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(password, salt);

        // Update the user with the new password and clear reset token and expiration
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.render('general/login', { success: 'Your password has been updated! You can now log in.' });
    } catch (err) {
        console.error(err);
        res.render('general/new-password', { token, error: 'Error updating your password.' });
    }
};
