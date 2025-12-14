const express = require("express");
const weather = require("../models/weather");
const { cacheMiddleware, invalidateCache } = require("../utils/cache");
const router = express.Router();

//Get all Weathers
router.get("/weathers", cacheMiddleware(600), async(req, res) =>{
    try{
        console.log("Fetching all weathers...");
        const weathers = await weather.find();
        console.log(`Found ${weathers.length} weather records`);
        res.json(weathers);
    } catch(err){
            console.error("Error fetching weathers:", err);
            res.status(500).json({message: err.message})
    }
});

//Get one Weather
router.get('/weathers/:id', cacheMiddleware(600), async (req, res) =>{
    try{
        const weatherObject = await weather.findById(req.params.id);
        if(weatherObject == null){
            return res.status(404).json({message: 'Weather not found'});
        } else {
            res.json(weatherObject);
        }
    }
    catch(err){
        res.status(500).json({message: err.message})
    }
});

//Create/Insert one Weather
router.post('/weather', async (req, res) => {
    const weatherObject = new weather({
        userId: req.body.userId,
        label: req.body.label,
        lat: req.body.lat,
        lon: req.body.lon,
        temp: req.body.temp,
        condition: req.body.condition,
        humidity: req.body.humidity,
        windSpeed: req.body.windSpeed,
        pressure: req.body.pressure,
        precipitation: req.body.precipitation
    });

    try{
        const weatherToSave = await weatherObject.save();
        // Invalidar caché de weather
        invalidateCache('/weathers');
        res.status(201).json(weatherToSave);
    }
    catch(error){
        console.error("Error creating weather:", error);
        res.status(500).json({ message: error.message});
    }
});

//Update one Weather
const updateWeather = async (req, res) => {
    try{
        console.log(`Updating weather with id: ${req.params.id}`);
        const weatherObject = await weather.findById(req.params.id);
        if(weatherObject == null){
            console.log('Weather not found');
            return res.status(404).json({message: 'Weather not found'});
        }

        if(req.body.userId != null){
            weatherObject.userId = req.body.userId;
        }
        if(req.body.label != null){
            weatherObject.label = req.body.label;
        }
        if(req.body.lat != null){
            weatherObject.lat = req.body.lat;
        }
        if(req.body.lon != null){
            weatherObject.lon = req.body.lon;
        }
        if(req.body.temp != null){
            weatherObject.temp = req.body.temp;
        }
        if(req.body.condition != null){
            weatherObject.condition = req.body.condition;
        }
        if(req.body.humidity != null){
            weatherObject.humidity = req.body.humidity;
        }
        if(req.body.windSpeed != null){
            weatherObject.windSpeed = req.body.windSpeed;
        }
        if(req.body.pressure != null){
            weatherObject.pressure = req.body.pressure;
        }
        if(req.body.precipitation != null){
            weatherObject.precipitation = req.body.precipitation;
        }

        const updatedWeather = await weatherObject.save();
        console.log('Weather updated successfully');
        // Invalidar caché de weather
        invalidateCache('/weathers');
        res.json(updatedWeather);
    }
    catch(error){
        console.error('Error updating weather:', error);
        res.status(500).json({message: error.message});
    }
};

router.put('/weathers/:id', updateWeather);

//Delete one Weather
router.delete('/weathers/:id', async (req, res) => {
    try{
        console.log(`Deleting weather with id: ${req.params.id}`);
        const weatherObject = await weather.findById(req.params.id);
        if(weatherObject == null){
            console.log('Weather not found');
            return res.status(404).json({message: 'Weather not found'});
        }

        await weatherObject.deleteOne();
        console.log('Weather deleted successfully');
        // Invalidar caché de weather
        invalidateCache('/weathers');
        res.json({message: 'Weather deleted successfully', deletedId: req.params.id});
    }
    catch(error){
        console.error('Error deleting weather:', error);
        res.status(500).json({message: error.message});
    }
});

module.exports = router;