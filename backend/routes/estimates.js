const router = require('express').Router();
const Estimate = require('../models/Estimate');

// GET ALL (For Dashboard List)
router.get('/', async (req, res) => {
    try {
        const estimates = await Estimate.find().sort({ updatedAt: -1 });
        res.json(estimates);
    } catch (err) { res.status(400).json('Error: ' + err); }
});

// GET ONE (For Editing)
router.get('/:id', async (req, res) => {
    try {
        const estimate = await Estimate.findById(req.params.id);
        res.json(estimate);
    } catch (err) { res.status(400).json('Error: ' + err); }
});

// CREATE NEW (Save)
router.post('/add', async (req, res) => {
    try {
        const newEstimate = new Estimate(req.body);
        await newEstimate.save();
        res.json('Estimate added!');
    } catch (err) { res.status(400).json('Error: ' + err); }
});

// UPDATE EXISTING (Edit & Save)
router.put('/update/:id', async (req, res) => {
    try {
        await Estimate.findByIdAndUpdate(req.params.id, req.body);
        res.json('Estimate updated!');
    } catch (err) { res.status(400).json('Error: ' + err); }
});

// DELETE
router.delete('/:id', async (req, res) => {
    try {
        await Estimate.findByIdAndDelete(req.params.id);
        res.json('Estimate deleted.');
    } catch (err) { res.status(400).json('Error: ' + err); }
});

module.exports = router;