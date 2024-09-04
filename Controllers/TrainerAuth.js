import Trainer from './../Models/Trainer.js';
import Client from './../Models/Client.js';
import DietPlan from './../Models/DietPlan.js';
import ProgramPlan from './../Models/ProgramPlan.js';
import WeightEntry from './../Models/WeightGraph.js';
import Meeting from './../Models/Meeting.js';
import { sendMail } from './../Helper/sendMail.js';
// import nodemailer from 'nodemailer';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// import { hash } from 'crypto';



export const register = async (req, res) => {
  const { Fname, lastName, email, password, profilePic, location, title } = req.body;

  try {
    
    let trainer = await Trainer.findOne({ email });
    if (trainer) {
      return res.status(400).json({ message: 'Trainer already exists' });
    }

    trainer = new Trainer({
      Fname,
      lastName,
      email,
      password,
      profilePic,
      location,
      title
    });

    const salt = await bcrypt.genSalt(10);
    trainer.password = await bcrypt.hash(password, salt);

    await trainer.save();

    // Create and return JWT
    const payload = { trainerId: trainer.id };
    const token = jwt.sign(payload, 'your_jwt_secret', { expiresIn: '1h' });

    res.status(201).json({ 
        message: 'Trainer created successfully',
        success: true,
        token
     });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
};


export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
      // Check if the trainer exists
      const trainer = await Trainer.findOne({ email });
      if (!trainer) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
  
      // Check if the password matches
      const isMatch = await bcrypt.compare(password, trainer.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
  
      // Create and return JWT
      const payload = { trainerId: trainer.id };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
  
      res.status(200).json({
        message: 'Login successful',
        success: true,
        token,
        trainer: {
          id: trainer.id,
          Fname: trainer.Fname,
          lastName: trainer.lastName,
          email: trainer.email,
          profilePic: trainer.profilePic,
          location: trainer.location,
          title: trainer.title
        }
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server error');
    }
};  
export const createClient = async (req, res) => {
  const { 
    profilePic, 
    startingWeight, 
    attachDietId, 
    attachProgramId, 
    fullname, 
    subamount, 
    email 
  } = req.body;
  const trainerId = req.trainer._id; // Assuming the trainer ID is available in the request

  try {
    // Check if client already exists
    let client = await Client.findOne({ email });

    // Fetch the selected diet and program plans
    const dietPlan = await DietPlan.findById(attachDietId);
    const programPlan = await ProgramPlan.findById(attachProgramId);

    if (!dietPlan || !programPlan) {
      return res.status(400).json({ message: 'Invalid diet or program plan selected' });
    }

    if (client) {
      // Update the existing client with new data
      client.profilePic = profilePic;
      client.startingWeight = startingWeight;
      client.attachDiet.push(attachDietId);
      client.attachProgram.push(attachProgramId);
      client.fullname = fullname;
      client.subamount = subamount;
      client.trainer = trainerId;
      client.ActiveNutrition.push(dietPlan);
      client.ActivePlan.push(programPlan);

      await client.save();

      // Associate the client with the trainer if not already associated
      await Trainer.findByIdAndUpdate(trainerId, {
        $addToSet: { 
          clients: client._id,
          client: {
            _id: client._id,
            fullname: client.fullname,
            email: client.email,
            profilePic: client.profilePic,
            subamount: client.subamount,
            startingWeight: client.startingWeight,
            attachDiet: client.attachDiet,
            attachProgram: client.attachProgram,
            ActiveNutrition: client.ActiveNutrition,
            ActivePlan: client.ActivePlan,
            trainer: client.trainer
          }
        },
      });

    } else {
      // Create a new client
      client = new Client({
        profilePic,
        startingWeight,
        attachDiet: [attachDietId],
        attachProgram: [attachProgramId],
        fullname,
        subamount,
        email,
        trainer: trainerId,
        ActiveNutrition: [dietPlan],
        ActivePlan: [programPlan],
      });

      await client.save();

      // Associate the new client with the trainer
      await Trainer.findByIdAndUpdate(trainerId, {
        $push: { 
          clients: client._id,
          client: {
            _id: client._id,
            fullname: client.fullname,
            email: client.email,
            profilePic: client.profilePic,
            subamount: client.subamount,
            startingWeight: client.startingWeight,
            attachDiet: client.attachDiet,
            attachProgram: client.attachProgram,
            ActiveNutrition: client.ActiveNutrition,
            ActivePlan: client.ActivePlan,
            trainer: client.trainer
          }
        },
      });
    }

    res.status(201).json({
      message: client ? 'Client updated successfully' : 'Client created successfully',
      success: true,
      client,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
};
   

   
export const createDietPlan = async (req, res) => {
  const { dietTitle, monday, tuesday, wednesday, thursday, friday, saturday, sunday } = req.body;
  const trainer = req.trainer;

  try {
    const dietPlan = new DietPlan({
      dietTitle,
      monday,
      tuesday,
      wednesday,
      thursday,
      friday,
      saturday,
      sunday
    });

    await dietPlan.save();

    await Trainer.findByIdAndUpdate(trainer, {
      $push: { dietPlans: dietPlan._id }
    });

    res.status(201).json({
      message: 'Diet Plan created successfully',
      success: true,
      dietPlan
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
};


export const createProgramPlan = async (req, res) => {
  const { programTitle, monday, tuesday, wednesday, thursday, friday, saturday, sunday } = req.body;
  const trainer = req.trainer; 

  try {
    // Create a new program plan with day-wise details
    const programPlan = new ProgramPlan({
      programTitle,
      monday,
      tuesday,
      wednesday,
      thursday,
      friday,
      saturday,
      sunday
    });

    await programPlan.save();

    // Associate the program plan with the trainer
    await Trainer.findByIdAndUpdate(trainer, {
      $push: { programPlans: programPlan._id }
    });

    res.status(201).json({
      message: 'Program Plan created successfully',
      success: true,
      programPlan
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
};


  export const getTrainerDietPlans = async (req, res) => {
    try {
      const trainerId = req.trainer;
      
      const trainer = await Trainer.findById(trainerId).populate('dietPlans');
      if (!trainer) {
        return res.status(404).json({ message: 'Trainer not found' });
      }
  
      res.status(200).json({
        success: true,
        dietPlans: trainer.dietPlans
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server error');
    }
  };


  export const getTrainerProgramPlans = async (req, res) => {
    try {
      const trainerId = req.trainer;
      
      const trainer = await Trainer.findById(trainerId).populate('programPlans');
      if (!trainer) {
        return res.status(404).json({ message: 'Trainer not found' });
      }
  
      res.status(200).json({
        success: true,
        programPlans: trainer.programPlans
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server error');
    }
  };

  export const getTrainerClients = async (req, res) => {
    try {
      const trainerId = req.trainer;
      
      const trainer = await Trainer.findById(trainerId).populate('clients');
      if (!trainer) {
        return res.status(404).json({ message: 'Trainer not found' });
      }
  
      res.status(200).json({
        success: true,
        clients: trainer.clients
      });   
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server error');
    }   
  };


  export const getClientOverview = async (req, res) => {
    const { id } = req.params;
    const trainerId = req.trainer; // Ensure this is set correctly in authMiddleware

    if (!trainerId) {
        return res.status(401).json({
            message: 'Unauthorized: Trainer ID not found',
            success: false,
        });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            message: 'Invalid client ID',
            success: false,
        });
    }

    try {
        // Find the client by ID and ensure it belongs to the authenticated trainer
        const client = await Client.findOne({ _id: id, trainer: trainerId })
            .populate('attachDiet')
            .populate('attachProgram');

        if (!client) {
            return res.status(404).json({
                message: 'Client not found or you do not have permission to view this client',
                success: false,
            });
        }

        // Get the associated trainer details
        const trainer = await Trainer.findById(trainerId);

        if (!trainer) {
            return res.status(404).json({
                message: 'Trainer not found',
                success: false,
            });
        }

        res.status(200).json({
            message: 'Client profile overview retrieved successfully',
            success: true,
            client: {
                profilePic: client.profilePic,
                status: "Bulk",  // Example: You can set or calculate the client's status based on your logic
                fullname: client.fullname,
                weightGraph: client.weightGraph,  // Dynamic weight graph data
                measurements: {
                    chestBack: client.measurements?.chestBack || "N/A",
                    rightArm: client.measurements?.rightArm || "N/A",
                    leftArm: client.measurements?.leftArm || "N/A",
                    rightLeg: client.measurements?.rightLeg || "N/A",
                    leftLeg: client.measurements?.leftLeg || "N/A",
                    waist: client.measurements?.waist || "N/A",
                },
                subscription: client.subscription,
                paymentAmount: client.subamount,
                membership: {
                    name: "Monthly Premium Plan",
                    expiresOn: client.membershipExpiresOn || "N/A",
                },
                activePlans: client.attachProgram,
                activeMealPlans: client.attachDiet,
                trainer: {
                    _id: trainer._id,
                    Fname: trainer.Fname,
                    lastName: trainer.lastName,
                    email: trainer.email,
                    profilePic: trainer.profilePic,
                    location: trainer.location,
                    title: trainer.title,
                },
            },
        });
    } catch (error) {
        console.error('Error in getClientOverview:', error);
        res.status(500).json({
            message: 'Server error',
            success: false,
            error: error.message
        });
    }
};
  
    export const addWeightEntry = async (req, res) => {
        const { weight } = req.body;
        const { id } = req.params;
        const trainerId = req.trainerId;
    
        try {
            // Ensure the client belongs to the trainer
            const client = await Client.findOne({ _id: id, trainer: trainerId });
            if (!client) {
                return res.status(404).json({
                    message: 'Client not found or you do not have permission to add weight entries for this client',
                    success: false,
                });
            }
    
            const weightEntry = new WeightEntry({
                client: id,
                weight,
            });
    
            await weightEntry.save();
    
            res.status(201).json({
                message: 'Weight entry added successfully',
                success: true,
                weightEntry,
            });
        } catch (error) {
            console.error(error.message);
            res.status(500).send('Server error');
        }
    };
    export const getWeightGraph = async (req, res) => {
        const { id } = req.params;
        const trainerId = req.trainerId;
    
        try {
            // Ensure the client belongs to the trainer
            const client = await Client.findOne({ _id: id, trainer: trainerId });
            if (!client) {
                return res.status(404).json({
                    message: 'Client not found or you do not have permission to view weight entries for this client',
                    success: false,
                });
            }
    
            const weightEntries = await WeightEntry.find({ client: id }).sort({ date: 1 });
    
            res.status(200).json({
                message: 'Weight graph retrieved successfully',
                success: true,
                weightGraph: weightEntries,
            });
        } catch (error) {
            console.error(error.message);
            res.status(500).send('Server error');
        }
    };
    export const updateWeightGraph = async (req, res) => {
        const { id } = req.params;
        const { weight } = req.body;
      
        try {
          const client = await Client.findById(id);
      
          if (!client) {
            return res.status(404).json({
              message: 'Client not found',
              success: false,
            });
          }
      
          // Push new weight entry to the weight graph
          client.weightGraph.push({ weight });
      
          // Save the client with the updated weight graph
          await client.save();
      
          res.status(200).json({
            message: 'Weight graph updated successfully',
            success: true,
            weightGraph: client.weightGraph,
          });
        } catch (error) {
          console.error(error.message);
          res.status(500).send('Server error');
        }
      }
      
    export const updateMembershipExpiry = async (req, res) => {
        const { id } = req.params;  // Client ID
        const trainerId = req.trainerId;  // Assuming trainerId is passed in auth middleware
        const { membershipDuration } = req.body;  // Duration in days
    
        try {
            // Ensure the client belongs to the trainer
            const client = await Client.findOne({ _id: id, trainer: trainerId });
            if (!client) {
                return res.status(404).json({
                    message: 'Client not found or you do not have permission to update this client\'s membership',
                    success: false,
                });
            }
    
            // Calculate new expiration date
            const currentDate = new Date();
            const newExpiryDate = new Date(currentDate.setDate(currentDate.getDate() + membershipDuration));
    
            client.membership.expiresOn = newExpiryDate;
            await client.save();
    
            res.status(200).json({
                message: 'Membership expiration date updated successfully',
                success: true,
                expiresOn: newExpiryDate,
            });
        } catch (error) {
            console.error(error.message);
            res.status(500).send('Server error');
        }
    };   
    export const updateClientProfile = async (req, res) => {
        try {
            const trainerId = req.trainer;
            const { Fname, lastName, email, location, title, profilePic } = req.body;
        
            // Find the trainer by ID
            const trainer = await Trainer.findById(trainerId);
        
            if (!trainer) {
              return res.status(404).json({ message: 'Trainer not found', success: false });
            }
        
            // Update the fields
            if (Fname) trainer.Fname = Fname;
            if (lastName) trainer.lastName = lastName;
            if (email) trainer.email = email;
            if (location) trainer.location = location;
            if (title) trainer.title = title;
            if (profilePic) trainer.profilePic = profilePic;
        
            // Save the updated trainer
            await trainer.save();
        
            res.status(200).json({
              message: 'Profile updated successfully',
              success: true,
              trainer: {
                Fname: trainer.Fname,
                lastName: trainer.lastName,
                email: trainer.email,
                location: trainer.location,
                title: trainer.title,
                profilePic: trainer.profilePic
              }
            });
          } catch (error) {
            console.error('Error updating profile:', error);
            res.status(500).json({ message: 'Server error', success: false });
          }
        }

        export const getTrainer = async (req, res) => { 
            const trainerId = req.trainer;
            const trainer = await Trainer.findById(trainerId);
            if (!trainer) {
              return res.status(404).json({ message: 'Trainer not found', success: false });
            }
            res.status(200).json({
              message: 'Trainer retrieved successfully',
              success: true,
              trainer: {
                id: trainer.id,
                Fname: trainer.Fname,
                lastName: trainer.lastName,
                email: trainer.email,
                profilePic: trainer.profilePic,
                location: trainer.location,
                title: trainer.title
              }
            });
          }

          export const logout = async (req, res) => {
            res.clearCookie('token');
            res.status(200).json({
              message: 'Logout successful',
              success: true
            });
          }


          export const forgetPassword = async (req, res) => {
            const { email } = req.body;
          
            try {
              // Find the trainer by email
              const trainer = await Trainer.findOne({ email });
              if (!trainer) return res.status(404).json({ message: 'Trainer not found' });
          
              // Create a reset token
              const resetToken = jwt.sign({ userId: trainer._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
              
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
              res.status(200).json({ message: 'Password reset link sent' });
            } catch (error) {
              // Log error details for debugging
              console.error('Error processing request:', error);
              res.status(500).json({ message: 'Error processing request', error: error.message });
            }
          };
          export const resetPassword = async (req, res) => {
            const { resetToken, newPassword } = req.body;
          
            try {
              // Verify the reset token
              jwt.verify(resetToken, process.env.JWT_SECRET, async (err, decoded) => {
                if (err) return res.status(400).json({ message: 'Invalid or expired reset token' });
          
                // Find user by ID from the token
                const trainer = await Trainer.findById(decoded.userId);
                if (!trainer) return res.status(404).json({ message: 'Trainer not found' });
          
                // Hash the new password
                const hashedPassword = await bcrypt.hash(newPassword, 10);
          
                // Update user's password
                trainer.password = hashedPassword;
                await trainer.save();
          
                res.status(200).json({ message: 'Password successfully reset' });
              });
            } catch (error) {
              console.error('Error resetting password:', error);
              res.status(500).json({ message: 'Error processing request', error: error.message });
            }
          };

          export const approveMeetingRequest = async (req, res) => {
            try {
              const { trainerId, meetingRequestId } = req.body;
              const trainer = await Trainer.findById(trainerId);
          
              if (!trainer) {
                return res.status(404).json({ success: false, message: 'Trainer not found' });
              }
          
              // Check if meetingRequest exists and is an array
              if (!trainer.meetingRequest || !Array.isArray(trainer.meetingRequest)) {
                return res.status(400).json({ success: false, message: 'Trainer has no meeting requests' });
              }
          
              // Find the meeting request in the trainer's meetingRequest array
              const meetingRequestIndex = trainer.meetingRequest.findIndex(
                request => request._id && request._id.toString() === meetingRequestId
              );
          
              if (meetingRequestIndex === -1) {
                return res.status(404).json({ success: false, message: 'Meeting request not found' });
              }
          
              const meetingRequest = trainer.meetingRequest[meetingRequestIndex];
          
              // Create new meeting with correct status
              const newMeeting = new Meeting({
                client: meetingRequest.client,
                trainer: meetingRequest.trainer,
                day: meetingRequest.day,
                time: meetingRequest.time,
                trainingType: meetingRequest.trainingType,
                isRecurring: meetingRequest.isRecurring,
                status: 'Approved' // Correctly set the status to a valid enum value
              });
              
              await newMeeting.save();
          
              // Update client with new meeting and notification
              const notificationMessage = `Meeting approved for ${meetingRequest.day} at ${meetingRequest.time} with Trainer ${trainer.Fname}`;
              await Client.findByIdAndUpdate(meetingRequest.client, {
                $push: { commingMeeting: newMeeting._id, notification: notificationMessage }
              });
          
              // Update trainer with new meeting and remove the meeting request
              await Trainer.findByIdAndUpdate(trainerId, {
                $push: { commingMeeting: newMeeting._id, notification: notificationMessage },
                $pull: { meetingRequest: { _id: meetingRequestId } }
              });
          
              res.status(200).json({ success: true, message: 'Meeting request approved', meeting: newMeeting });
            } catch (error) {
              console.error(error);
              res.status(500).json({ success: false, message: 'Error approving meeting request', error: error.message });
            }
          };
          