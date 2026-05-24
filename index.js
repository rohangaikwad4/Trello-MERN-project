require("dotenv").config();
const express = require("express");
const path = require("path");
const jwt = require("jsonwebtoken");
const authMiddleware = require("./middleware");
const { userModel, organizationModel, boardModel, issueModel } = require("./models");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/signup", async (req, res) => {
    const { username, password } = req.body;
    const userExists = await userModel.findOne({ username });
    if (userExists) {
        return res.status(411).json({ message: "User with this username already exists" });
    }
    const newUser = await userModel.create({ username, password });
    res.json({ id: newUser._id });
});

app.post("/signin", async (req, res) => {
    const { username, password } = req.body;
    const user = await userModel.findOne({ username, password });
    if (!user) {
        return res.status(403).json({ message: "Incorrect credentials" });
    }
    const token = jwt.sign({ userId: user._id }, "super123123");
    res.json({ token });
});

app.post("/organization", authMiddleware, async (req, res) => {
    const org = await organizationModel.create({
        title: req.body.title,
        description: req.body.description,
        admin: req.userId,
        members: []
    });
    res.json({ message: "Org created", id: org._id });
});

app.get("/organization", authMiddleware, async (req, res) => {
    const orgs = await organizationModel.find({
        $or: [{ admin: req.userId }, { members: req.userId }]
    });
    res.json({ organizations: orgs });
});

app.get("/organization/:id", authMiddleware, async (req, res) => {
    const org = await organizationModel.findById(req.params.id);
    if (!org) {
        return res.status(404).json({ message: "Organization not found" });
    }
    const members = await userModel.find({ _id: { $in: org.members } });
    const admin = await userModel.findById(org.admin);
    res.json({
        organization: {
            ...org.toObject(),
            adminUsername: admin ? admin.username : null,
            members: members.map(m => ({ id: m._id, username: m.username }))
        }
    });
});

app.post("/add-member-to-organization", authMiddleware, async (req, res) => {
    const { organizationId, memberUsername } = req.body;
    const org = await organizationModel.findById(organizationId);
    if (!org) {
        return res.status(411).json({ message: "Organization doesn't exist" });
    }
    if (org.admin.toString() !== req.userId) {
        return res.status(403).json({ message: "You are not the admin" });
    }
    const member = await userModel.findOne({ username: memberUsername });
    if (!member) {
        return res.status(411).json({ message: "User not found" });
    }
    if (org.members.some(m => m.toString() === member._id.toString())) {
        return res.status(411).json({ message: "User is already a member" });
    }
    org.members.push(member._id);
    await org.save();
    res.json({ message: "New member added!" });
});

app.delete("/members", authMiddleware, async (req, res) => {
    const { organizationId, memberUsername } = req.body;
    const org = await organizationModel.findById(organizationId);
    if (!org) {
        return res.status(411).json({ message: "Organization doesn't exist" });
    }
    if (org.admin.toString() !== req.userId) {
        return res.status(403).json({ message: "You are not the admin" });
    }
    const member = await userModel.findOne({ username: memberUsername });
    if (!member) {
        return res.status(411).json({ message: "User not found" });
    }
    org.members = org.members.filter(m => m.toString() !== member._id.toString());
    await org.save();
    res.json({ message: "Member deleted!" });
});

app.post("/board", authMiddleware, async (req, res) => {
    const { title, organizationId } = req.body;
    const board = await boardModel.create({
        title,
        organization: organizationId,
        createdBy: req.userId
    });
    res.json({ message: "Board created", id: board._id });
});

app.get("/boards/:organizationId", authMiddleware, async (req, res) => {
    const boards = await boardModel.find({ organization: req.params.organizationId });
    res.json({ boards });
});

app.post("/issue", authMiddleware, async (req, res) => {
    const { title, description, boardId, assignedTo } = req.body;
    const issue = await issueModel.create({
        title,
        description,
        board: boardId,
        assignedTo: assignedTo || null,
        createdBy: req.userId,
        status: "todo"
    });
    res.json({ message: "Issue created", id: issue._id });
});

app.get("/issues/:boardId", authMiddleware, async (req, res) => {
    const issues = await issueModel.find({ board: req.params.boardId });
    const populated = await userModel.find({ _id: { $in: issues.map(i => i.assignedTo).filter(Boolean) } });
    const userMap = {};
    populated.forEach(u => { userMap[u._id] = u.username; });
    res.json({
        issues: issues.map(i => ({
            ...i.toObject(),
            assignedToUsername: i.assignedTo ? userMap[i.assignedTo] || "Unassigned" : "Unassigned"
        }))
    });
});

app.put("/issue/:id", authMiddleware, async (req, res) => {
    const { status } = req.body;
    await issueModel.findByIdAndUpdate(req.params.id, { status });
    res.json({ message: "Issue updated" });
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});
