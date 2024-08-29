import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Client from '../Models/Client.js';
import Meeting from '../Models/Meeting.js';
import Trainer from '../Models/Trainer.js';
import { sendMail } from './../Helper/sendMail.js';


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

export const logout = async (req, res) => {
    res.clearCookie('token');
    res.status(200).json({
      message: 'Logout successful',
      success: true
    });
  }
// You can add more client-related controller functions here as needed


export const getActivePlans = async (req, res) => {
  try {
    // Retrieve the authenticated client's ID from the request object
    const clientId = req.client._id;

    // Find the client by ID and populate the ActivePlan field with the related ProgramPlan documents
    const client = await Client.findById(clientId).populate('ActivePlan');

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Send back the populated active plans
    res.json({
      success: true,
      workout: client.ActivePlan
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

  export const getActiveNutrition = async (req, res) => {
    try {
      const clientId = req.client._id;

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


  export const changePassword = async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const clientId = req.client.id; // Assuming you have middleware that sets req.client
  
      // Find the client by ID
      const client = await Client.findById(clientId);
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }
  
      // Check if the current password is correct
      const isMatch = await bcrypt.compare(currentPassword, client.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
  
      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
  
      // Update the client's password
      client.password = hashedPassword;
      await client.save();
  
      res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Error in change password:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };

  export const updateClientProfile = async (req, res) => {
    try {
        const clientId = req.client.id; // Assuming you have middleware that sets req.client

        // Find the client by ID
        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        // Update client's profile
        if (req.body.Fname) client.Fname = req.body.Fname;
        if (req.body.lastName) client.lastName = req.body.lastName;
        if (req.body.email) client.email = req.body.email;
        if (req.body.location) client.location = req.body.location;
        if (req.body.title) client.title = req.body.title;
        if (req.body.profilePic) client.profilePic = req.body.profilePic;

        // Update weight according to date
        if (req.body.weight) {
            const { date, weight } = req.body.weight;
            const weightEntry = client.weight.find(entry => 
                new Date(entry.date).toDateString() === new Date(date).toDateString()
            );

            if (weightEntry) {
                // Update existing weight entry
                weightEntry.weight = weight;
            } else {
                // Add new weight entry
                client.weight.push({ date, weight });
            }
        }

        await client.save();

        res.status(200).json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error in update client profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const createMeeting = async (req, res) => {
  try {
    const { clientId, trainerId, day, time, trainingType, isRecurring } = req.body;

    const client = await Client.findById(clientId);
    const trainer = await Trainer.findById(trainerId);
    console.log(client, trainer);

    // Create new meeting
    const newMeeting = new Meeting({
      client: clientId,
      trainer: trainerId,
      day,
      time,
      trainingType,
      isRecurring
    });

    await newMeeting.save();

    // Create notification message
    const notificationMessage = `New meeting scheduled on ${day} at ${time} with Trainer ${trainer.Fname} and Client ${client.fullname}`;

    // Update client with new meeting and notification
    await Client.findByIdAndUpdate(clientId, {
      $push: { 
        commingMeeting: newMeeting._id,
        notification: notificationMessage
      }
    });

    // Update trainer with new meeting and notification
    await Trainer.findByIdAndUpdate(trainerId, {
      $push: { 
        commingMeeting: newMeeting._id,
        notification: notificationMessage
      }
    });

    res.status(201).json({
      success: true,
      message: 'Meeting created successfully',
      meeting: newMeeting
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error creating meeting',
      error: error.message
    });
  }
};
export const rescheduleMeeting = async (req, res) => {
  try {
    const { meetingId, newDay, newTime } = req.body;

    // Find the meeting
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Get client and trainer details
    const client = await Client.findById(meeting.client);
    const trainer = await Trainer.findById(meeting.trainer);

    if (!client || !trainer) {
      return res.status(404).json({
        success: false,
        message: 'Client or Trainer not found'
      });
    }

    // Update meeting details
    meeting.day = newDay;
    meeting.time = newTime;
    await meeting.save();

    // Create notification message
    const notificationMessage = `Meeting rescheduled to ${newDay} at ${newTime} with Trainer ${trainer.Fname} and Client ${client.fullname}`;

    // Update client with notification
    await Client.findByIdAndUpdate(client._id, {
      $push: { 
        notification: notificationMessage
      }
    });

    // Update trainer with notification
    await Trainer.findByIdAndUpdate(trainer._id, {
      $push: { 
        notification: notificationMessage
      }
    });

    res.status(200).json({
      success: true,
      message: 'Meeting rescheduled successfully',
      meeting: meeting
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error rescheduling meeting',
      error: error.message
    });
  }
};

export const getUpcomingMeetingsForClient = async (req, res) => {
  try {
    const clientId = req.client.id;

    // Find the client
    const client = await Client.findById(clientId);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    console.log('Client commingMeeting IDs:', client.commingMeeting);

    // Fetch all meetings from the Meeting collection without date filter
    const allMeetings = await Meeting.find({
      _id: { $in: client.commingMeeting }
    }).sort({ day: 1, time: 1 })
      .populate('trainer', 'Fname Lname email')
      .lean();

    console.log('Fetched all meetings:', JSON.stringify(allMeetings, null, 2));

    // Format all the meetings data
    const formattedMeetings = allMeetings.map(meeting => ({
      _id: meeting._id,
      day: meeting.day,
      time: meeting.time,
      trainingType: meeting.trainingType,
      isRecurring: meeting.isRecurring,
      trainer: meeting.trainer ? {
        name: `${meeting.trainer.Fname} ${meeting.trainer.Lname}`,
        email: meeting.trainer.email
      } : null
    }));

    // Separate upcoming meetings (if needed)
    const now = new Date();
    const upcomingMeetings = formattedMeetings.filter(meeting => new Date(meeting.day) >= now);

    res.status(200).json({
      success: true,
      message: 'All meetings fetched successfully',
      allMeetings: formattedMeetings,
      upcomingMeetings: upcomingMeetings,
      totalMeetings: formattedMeetings.length,
      upcomingMeetingsCount: upcomingMeetings.length
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching meetings',
      error: error.message
    });
  }
};