import mongoose from 'mongoose';

const programPlanSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  modules: {
    type: [String], // Array of strings for module names
    required: true
  },
  duration: {
    type: String, // E.g., "6 weeks"
    required: true
  }
});

const ProgramPlan = mongoose.model('ProgramPlan', programPlanSchema);

export default ProgramPlan;
