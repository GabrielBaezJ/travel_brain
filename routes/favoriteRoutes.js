const express = require("express");
const FavoriteRoute = require("../models/favorite_routes");
const router = express.Router();

//Get all Favorite Routes
router.get("/favorite-routes", async(req, res) =>{
    try{
        console.log("Fetching all favorite routes...");
        const favoriteRoutes = await FavoriteRoute.find();
        console.log(`Found ${favoriteRoutes.length} favorite route records`);
        res.json(favoriteRoutes);
    } catch(err){
            console.error("Error fetching favorite routes:", err);
            res.status(500).json({message: err.message})
    }
});

//Get one Favorite Route
router.get('/favorite-routes/:id', async (req, res) =>{
    try{
        const favoriteRouteObject = await FavoriteRoute.findById(req.params.id);
        if(favoriteRouteObject == null){
            return res.status(404).json({message: 'Favorite route not found'});
        } else {
            res.json(favoriteRouteObject);
        }
    }
    catch(err){
        res.status(500).json({message: err.message})
    }
});

//Create/Insert one Favorite Route
router.post('/favorite-routes', async (req, res) => {
    const favoriteRouteObject = new FavoriteRoute({
        userId: req.body.userId,
        name: req.body.name,
        origin: {
            lat: req.body.origin?.lat,
            lon: req.body.origin?.lon,
            label: req.body.origin?.label
        },
        destination: {
            lat: req.body.destination?.lat,
            lon: req.body.destination?.lon,
            label: req.body.destination?.label
        },
        distanceKm: req.body.distanceKm,
        durationSec: req.body.durationSec,
        mode: req.body.mode,
        createdAt: req.body.createdAt || new Date()
    });

    try{
        const favoriteRouteToSave = await favoriteRouteObject.save();
        res.status(201).json(favoriteRouteToSave);
    }
    catch(error){
        console.error("Error creating favorite route:", error);
        res.status(500).json({ message: error.message});
    }
});

//Update one Favorite Route
router.put('/favorite-routes/:id', async (req, res) => {
    try{
        console.log(`Updating favorite route with id: ${req.params.id}`);
        const favoriteRouteObject = await FavoriteRoute.findById(req.params.id);
        if(favoriteRouteObject == null){
            console.log('Favorite route not found');
            return res.status(404).json({message: 'Favorite route not found'});
        }

        if(req.body.userId != null){
            favoriteRouteObject.userId = req.body.userId;
        }
        if(req.body.name != null){
            favoriteRouteObject.name = req.body.name;
        }
        if(req.body.origin != null){
            if(req.body.origin.lat != null) favoriteRouteObject.origin.lat = req.body.origin.lat;
            if(req.body.origin.lon != null) favoriteRouteObject.origin.lon = req.body.origin.lon;
            if(req.body.origin.label != null) favoriteRouteObject.origin.label = req.body.origin.label;
        }
        if(req.body.destination != null){
            if(req.body.destination.lat != null) favoriteRouteObject.destination.lat = req.body.destination.lat;
            if(req.body.destination.lon != null) favoriteRouteObject.destination.lon = req.body.destination.lon;
            if(req.body.destination.label != null) favoriteRouteObject.destination.label = req.body.destination.label;
        }
        if(req.body.distanceKm != null){
            favoriteRouteObject.distanceKm = req.body.distanceKm;
        }
        if(req.body.durationSec != null){
            favoriteRouteObject.durationSec = req.body.durationSec;
        }
        if(req.body.mode != null){
            favoriteRouteObject.mode = req.body.mode;
        }

        const updatedFavoriteRoute = await favoriteRouteObject.save();
        console.log('Favorite route updated successfully');
        res.json(updatedFavoriteRoute);
    }
    catch(error){
        console.error('Error updating favorite route:', error);
        res.status(500).json({message: error.message});
    }
});

//Delete one Favorite Route
router.delete('/favorite-routes/:id', async (req, res) => {
    try{
        console.log(`Deleting favorite route with id: ${req.params.id}`);
        const favoriteRouteObject = await FavoriteRoute.findById(req.params.id);
        if(favoriteRouteObject == null){
            console.log('Favorite route not found');
            return res.status(404).json({message: 'Favorite route not found'});
        }

        await favoriteRouteObject.deleteOne();
        console.log('Favorite route deleted successfully');
        res.json({message: 'Favorite route deleted successfully', deletedId: req.params.id});
    }
    catch(error){
        console.error('Error deleting favorite route:', error);
        res.status(500).json({message: error.message});
    }
});

module.exports = router;
