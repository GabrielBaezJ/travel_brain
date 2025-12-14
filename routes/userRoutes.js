const express = require("express");
const User = require("../models/users");
const { cacheMiddleware, invalidateCache } = require("../utils/cache");
const router = express.Router();

//Get all Users
router.get("/users", cacheMiddleware(300), async(req, res) =>{
    try{
        console.log("Fetching all users...");
        const users = await User.find();
        console.log(`Found ${users.length} user records`);
        res.json(users);
    } catch(err){
            console.error("Error fetching users:", err);
            res.status(500).json({message: err.message})
    }
});

//Get one User
router.get('/users/:id', cacheMiddleware(300), async (req, res) =>{
    try{
        const userObject = await User.findById(req.params.id);
        if(userObject == null){
            return res.status(404).json({message: 'User not found'});
        } else {
            res.json(userObject);
        }
    }
    catch(err){
        res.status(500).json({message: err.message})
    }
});

//Create/Insert one User
router.post('/users', async (req, res) => {
    const userObject = new User({
        username: req.body.username,
        email: req.body.email,
        passwordHash: req.body.passwordHash,
        name: req.body.name,
        role: req.body.role,
        status: req.body.status,
        tz: req.body.tz,
        createdAt: req.body.createdAt
    });

    try{
        const userToSave = await userObject.save();
        // Invalidar caché de usuarios
        invalidateCache('/users');
        res.status(201).json(userToSave);
    }
    catch(error){
        console.error("Error creating user:", error);
        res.status(500).json({ message: error.message});
    }
});

//Update one User
const updateUser = async (req, res) => {
    try{
        console.log(`Updating user with id: ${req.params.id}`);
        const userObject = await User.findById(req.params.id);
        if(userObject == null){
            console.log('User not found');
            return res.status(404).json({message: 'User not found'});
        }

        if(req.body.username != null){
            userObject.username = req.body.username;
        }
        if(req.body.email != null){
            userObject.email = req.body.email;
        }
        if(req.body.passwordHash != null){
            userObject.passwordHash = req.body.passwordHash;
        }
        if(req.body.name != null){
            userObject.name = req.body.name;
        }
        if(req.body.role != null){
            userObject.role = req.body.role;
        }
        if(req.body.status != null){
            userObject.status = req.body.status;
        }
        if(req.body.tz != null){
            userObject.tz = req.body.tz;
        }

        const updatedUser = await userObject.save();
        console.log('User updated successfully');
        // Invalidar caché de usuarios
        invalidateCache('/users');
        res.json(updatedUser);
    }
    catch(error){
        console.error('Error updating weather:', error);
        res.status(500).json({message: error.message});
    }
};

router.put('/users/:id', updateUser);

//Delete one User
router.delete('/users/:id', async (req, res) => {
    try{
        console.log(`Deleting user with id: ${req.params.id}`);
        const userObject = await User.findById(req.params.id);
        if(userObject == null){
            console.log('User not found');
            return res.status(404).json({message: 'User not found'});
        }

        await userObject.deleteOne();
        console.log('User deleted successfully');
        // Invalidar caché de usuarios
        invalidateCache('/users');
        res.json({message: 'User deleted successfully', deletedId: req.params.id});
    }
    catch(error){
        console.error('Error deleting user:', error);
        res.status(500).json({message: error.message});
    }
});

module.exports = router;