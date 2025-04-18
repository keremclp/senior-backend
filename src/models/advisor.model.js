const mongoose = require("mongoose");

const AdvisorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please provide name"],
        minlength: 3,
        maxlength: 50,
    },
    email: {
        type: String,
        unique: true,
        required: [true, "Please provide email"],
        validate: {
        validator: (value) => {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        },
        message: "Please provide valid email",
        },
    },
    info: { 
        type: String,
        required: [true, "Please provide info"],
    },
    secondInfo: { 
        type: String,
        required: [true, "Please provide second info"],
    },
    tags: {
        type: [String],
        required: [true, "Please provide tags"],
    },
    prefix: {
        type: String,
        required: [true, "Please provide prefix"],
    },
});

AdvisorSchema.index({ prefix: 1, name: 1 });

const Advisor = mongoose.model("Advisor", AdvisorSchema);

module.exports = Advisor;