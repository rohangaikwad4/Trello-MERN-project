const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://rohan:rohan123@rohan.nl5zlot.mongodb.net/trello");

const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

const organizationSchema = new mongoose.Schema({
    title: String,
    description: String,
    admin: mongoose.Types.ObjectId,
    members: [mongoose.Types.ObjectId]
});

const boardSchema = new mongoose.Schema({
    title: String,
    organization: mongoose.Types.ObjectId,
    createdBy: mongoose.Types.ObjectId
});

const issueSchema = new mongoose.Schema({
    title: String,
    description: String,
    status: { type: String, enum: ["todo", "in-progress", "done"], default: "todo" },
    board: mongoose.Types.ObjectId,
    assignedTo: mongoose.Types.ObjectId,
    createdBy: mongoose.Types.ObjectId
});

const organizationModel = mongoose.model("organization", organizationSchema);
const userModel = mongoose.model("users", userSchema);
const boardModel = mongoose.model("board", boardSchema);
const issueModel = mongoose.model("issue", issueSchema);

module.exports = {
    organizationModel,
    userModel,
    boardModel,
    issueModel
};
