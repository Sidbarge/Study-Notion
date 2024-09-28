const mongoose = require("mongoose");

const subsectionSchema = new mongoose.Schema({
  title: {
    type: String,
  },
  description: {},
  timeDuration: {
    type: String,
  },
  videoUrl: {
    type: String,
  },
});

let SubSection;
try {
  SubSection = mongoose.model('SubSection');
} catch (error) {
  SubSection = mongoose.model('SubSection', subsectionSchema);
}

module.exports = SubSection;