const express = require("express");
const Trip = require("../models/trips");
const router = express.Router();

//Get all Trips
router.get("/api/trips", async(req, res) =>{
    try{
        console.log("Fetching all trips...");
        const trips = await Trip.find();
        console.log(`Found ${trips.length} trip records`);
        res.json(trips);
    } catch(err){
            console.error("Error fetching trips:", err);
            res.status(500).json({message: err.message})
    }
});

//Get one Trip
router.get('/api/trips/:id', async (req, res) =>{
    try{
        const tripObject = await Trip.findById(req.params.id);
        if(tripObject == null){
            return res.status(404).json({message: 'Trip not found'});
        } else {
            res.json(tripObject);
        }
    }
    catch(err){
        res.status(500).json({message: err.message})
    }
});

//Create/Insert one Trip
router.post('/api/trips', async (req, res) => {
    const tripObject = new Trip({
        userId: req.body.userId,
        title: req.body.title,
        destination: req.body.destination,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        budget: req.body.budget,
        description: req.body.description
    });

    try{
        const tripToSave = await tripObject.save();
        res.status(201).json(tripToSave);
    }
    catch(error){
        console.error("Error creating trip:", error);
        res.status(500).json({ message: error.message});
    }
});

//Update one Trip
router.put('/api/trips/:id', async (req, res) => {
    try{
        console.log(`Updating trip with id: ${req.params.id}`);
        const tripObject = await Trip.findById(req.params.id);
        if(tripObject == null){
            console.log('Trip not found');
            return res.status(404).json({message: 'Trip not found'});
        }

        if(req.body.userId != null){
            tripObject.userId = req.body.userId;
        }
        if(req.body.title != null){
            tripObject.title = req.body.title;
        }
        if(req.body.destination != null){
            tripObject.destination = req.body.destination;
        }
        if(req.body.startDate != null){
            tripObject.startDate = req.body.startDate;
        }
        if(req.body.endDate != null){
            tripObject.endDate = req.body.endDate;
        }
        if(req.body.budget != null){
            tripObject.budget = req.body.budget;
        }
        if(req.body.description != null){
            tripObject.description = req.body.description;
        }

        const updatedTrip = await tripObject.save();
        console.log('Trip updated successfully');
        res.json(updatedTrip);
    }
    catch(error){
        console.error('Error updating trip:', error);
        res.status(500).json({message: error.message});
    }
});

//Delete one Trip
router.delete('/api/trips/:id', async (req, res) => {
    try{
        console.log(`Deleting trip with id: ${req.params.id}`);
        const tripObject = await Trip.findById(req.params.id);
        if(tripObject == null){
            console.log('Trip not found');
            return res.status(404).json({message: 'Trip not found'});
        }

        await tripObject.deleteOne();
        console.log('Trip deleted successfully');
        res.json({message: 'Trip deleted successfully', deletedId: req.params.id});
    }
    catch(error){
        console.error('Error deleting trip:', error);
        res.status(500).json({message: error.message});
    }
});

module.exports = router;