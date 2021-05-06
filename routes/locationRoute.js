const express = require("express");
const fetch = require("node-fetch");
const router = express.Router();
const config = require("../config");

router.get("/states", async function (req, res, next) {
    try {
        const apiUrl = `${config.cowinApiUrl}api/v2/admin/location/states`;
        const response = await fetch(apiUrl, {headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36' },});
        const states = await response.json();
        res.json(states);
    } catch (err) {
      console.error(`Error while getting stocks data`, err.message);
      next(err);
    }
});

router.get("/districts/:stateId", async function (req, res, next) {
    const stateId = req.params.stateId;
    try {
        const apiUrl = `${config.cowinApiUrl}api/v2/admin/location/districts/${stateId}`;
        const response = await fetch(apiUrl, {headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36' },});
        const states = await response.json();
        res.json(states);
    } catch (err) {
      console.error(`Error while getting stocks data`, err.message);
      next(err);
    }
});

module.exports = router;