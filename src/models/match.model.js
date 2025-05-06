const mongoose = require("mongoose");

const MatchSchema = new mongoose.Schema({
    resumeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resume',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    advisors: [{
        advisor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Advisor',
            required: true
        },
        matchScore: Number,
        matchingAreas: [String]
    }],
}, { timestamps: true });

module.exports = mongoose.model("Match", MatchSchema);
