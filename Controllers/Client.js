import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Client from '../Models/Client.js';
import crypto from 'crypto';
import { sendMail } from './../Helper/sendMail.js';
import nodemailer from 'nodemailer';
import mongoose from 'mongoose';
import { token } from 'morgan';

export const register = async (req, res) => {
  const { fullname, email, password, confirmPassword } = req.body;

  try {
    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Check if client already exists
    let client = await Client.findOne({ email });
    if (client) {
      return res.status(400).json({ message: 'Client already exists' });
    }

    // Create new client
    client = new Client({
      fullname,
      email,
      password,
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    client.password = await bcrypt.hash(password, salt);

    // Save client
    await client.save();

    // Create and return JWT
    const payload = { clientId: client._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({
      message: 'Client registered successfully',
      success: true,
      token,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the client exists
    const client = await Client.findOne({ email });
    if (!client) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if the password matches
    const isMatch = await bcrypt.compare(password, client.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create and return JWT
    const payload = { clientId: client._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      message: 'Login successful',
      success: true,
      token,
      client: {
        id: client._id,
        fullname: client.fullname,
        email: client.email,
        profilePic: client.profilePic,
        startingWeight: client.startingWeight,
        subscription: client.subscription,
        subamount: client.subamount,
        ActivePlan: client.ActivePlan,
        ActiveNutrition: client.ActiveNutrition,
        measurements: client.measurements,
        weightGraph: client.weightGraph,
        membershipExpiresOn: client.membershipExpiresOn,
        trainer: client.trainer,
        commingMeeting: client.commingMeeting,
        weightGraph:client.weightGraph,
        weight:client.weight,
        notification:client.notification,
      }
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
};

// You can add more client-related controller functions here as needed


export const getActivePlans = async (req, res) => {
    try {
      const clientId = req.client.clientId; // Assuming you're using the clientAuthMiddleware
  
      const client = await Client.findById(clientId)
        .populate('ActivePlan')
        
  
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }
  
      res.status(200).json({
        status:200,
        success: true,
        activePlan: client.ActivePlan,
        
      });
    } catch (error) {
      console.error('Error fetching active plans:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };


  export const getActiveNutrition = async (req, res) => {
    try {
      const clientId = req.client.clientId; // Assuming you're using the clientAuthMiddleware
  
      const client = await Client.findById(clientId)
        .populate('ActiveNutrition');
  
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }
  
      res.status(200).json({
        success: true,
        activeNutrition: client.ActiveNutrition
      });
    } catch (error) {
      console.error('Error fetching active plans:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };


  const generateResetToken = () => {
    return crypto.randomBytes(20).toString('hex');
  };
  export const forgetPassword = async (req, res) => {
    const { email } = req.body;
  
    try {
      // Find the client by email
      const client = await Client.findOne({ email });
      if (!client) return res.status(404).json({ message: 'Client not found' });
  
      // Create a reset token
      const resetToken = jwt.sign({ userId: client._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      
      // Log reset token for debugging
      console.log('Reset Token:', resetToken);
  
      // Construct reset URL
      const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
      console.log('Reset URL:', resetUrl);
  
      // Email configuration
      const subject = 'Password Reset Request';
      const text = `You requested a password reset. Click the link below to reset your password:\n\n${resetUrl}`;
  
      // Send email
      await sendMail(email, subject, text);
  
      // Respond to the client
      res.status(200).json({ message: 'Password reset link sent',
        token:resetToken

       });
    } catch (error) {
      // Log error details for debugging
      console.error('Error processing request:', error);
      res.status(500).json({ message: 'Error processing request', error: error.message });
    }
  };
  
  export const resetPassword = async (req, res) => {
    try {
      const { token, newPassword } = req.body;
  
      // Verify the JWT token
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (error) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }
  
      // Find the client using the decoded userId
      const client = await Client.findById(decoded.userId);
  
      if (!client) {
        return res.status(400).json({ message: 'Client not found' });
      }
  
      // Check if the token has expired
      if (decoded.exp < Date.now() / 1000) {
        return res.status(400).json({ message: 'Reset token has expired' });
      }
  
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
  
      client.password = hashedPassword;
      await client.save();
  
      res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
      console.error('Error in reset password:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };