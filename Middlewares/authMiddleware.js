import jwt from 'jsonwebtoken';
import Trainer from './../Models/Trainer.js'; // Adjust the path as needed

const authMiddleware = async (req, res, next) => {
  // Get token from headers
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the trainer by ID
    const trainer = await Trainer.findById(decoded.trainerId);

    if (!trainer) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Attach trainer to the request object
    req.trainer = trainer;

    // Proceed to the next middleware or route handler
    next();
  } catch (err) {
    console.error(err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export default authMiddleware;
