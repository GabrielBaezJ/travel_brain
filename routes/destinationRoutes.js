const express = require("express");
const Destination = require("../models/destinations");
const router = express.Router();

//Get all Destinations
router.get("/api/destinations", async(req, res) =>{
    try{
        console.log("Fetching all destinations...");
        const destinations = await Destination.find();
        console.log(`Found ${destinations.length} destination records`);
        res.json(destinations);
    } catch(err){
            console.error("Error fetching destinations:", err);
            res.status(500).json({message: err.message})
    }
});

//Get one Destination
router.get('/api/destinations/:id', async (req, res) =>{
    try{
        const destinationObject = await Destination.findById(req.params.id);
        if(destinationObject == null){
            return res.status(404).json({message: 'Destination not found'});
        } else {
            res.json(destinationObject);
        }
    }
    catch(err){
        res.status(500).json({message: err.message})
    }
});

//Create/Insert one Destination
router.post('/api/destinations', async (req, res) => {
    const destinationObject = new Destination({
        name: req.body.name,
        country: req.body.country,
        description: req.body.description,
        lat: req.body.lat,
        lng: req.body.lng,
        img: req.body.img,
        userId: req.body.userId,
        createdAt: req.body.createdAt || new Date()
    });

    try{
        const destinationToSave = await destinationObject.save();
        res.status(201).json(destinationToSave);
    }
    catch(error){
        console.error("Error creating destination:", error);
        res.status(500).json({ message: error.message});
    }
});

//Update one Destination
router.put('/api/destinations/:id', async (req, res) => {
    try{
        console.log(`Updating destination with id: ${req.params.id}`);
        const destinationObject = await Destination.findById(req.params.id);
        if(destinationObject == null){
            console.log('Destination not found');
            return res.status(404).json({message: 'Destination not found'});
        }

        if(req.body.name != null){
            destinationObject.name = req.body.name;
        }
        if(req.body.country != null){
            destinationObject.country = req.body.country;
        }
        if(req.body.description != null){
            destinationObject.description = req.body.description;
        }
        if(req.body.lat != null){
            destinationObject.lat = req.body.lat;
        }
        if(req.body.lng != null){
            destinationObject.lng = req.body.lng;
        }
        if(req.body.img != null){
            destinationObject.img = req.body.img;
        }
        if(req.body.userId != null){
            destinationObject.userId = req.body.userId;
        }

        const updatedDestination = await destinationObject.save();
        console.log('Destination updated successfully');
        res.json(updatedDestination);
    }
    catch(error){
        console.error('Error updating destination:', error);
        res.status(500).json({message: error.message});
    }
});

//Delete one Destination
router.delete('/api/destinations/:id', async (req, res) => {
    try{
        console.log(`Deleting destination with id: ${req.params.id}`);
        const destinationObject = await Destination.findById(req.params.id);
        if(destinationObject == null){
            console.log('Destination not found');
            return res.status(404).json({message: 'Destination not found'});
        }

        await destinationObject.deleteOne();
        console.log('Destination deleted successfully');
        res.json({message: 'Destination deleted successfully', deletedId: req.params.id});
    }
    catch(error){
        console.error('Error deleting destination:', error);
        res.status(500).json({message: error.message});
    }
});

module.exports = router;