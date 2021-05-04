const express = require("express");
const fetch = require("node-fetch");
const router = express.Router();
const config = require("../config");
const common = require("../services/common");
const dateformat = require("dateformat");

/* GET Stocks Data. */
router.get("/", async function (req, res, next) {
  try {
    res.json({ message: "Working" });
  } catch (err) {
    console.error(`Error while getting stocks data`, err.message);
    next(err);
  }
});

async function getCenterInfo(pincode, days) {
  var centerList = [];
  var apiUrl;
  try {
    const weeks = Math.floor(days/7)
    if(weeks == 0) {
      const today = new Date();
      const newDate = dateformat(today, "dd-mm-yyyy")
      apiUrl = `${config.cowinApiUrl}api/v2/appointment/sessions/public/calendarByPin?pincode=${pincode}&date=${newDate}`;
      const response = await fetch(apiUrl);
      const centers = await response.json();
      return centers
    }else {
      for(let i = 0; i < weeks; i ++) {
        console.log(i);
        const today = new Date();
        var newFutureDate = new Date(today.setDate(today.getDate() + (7 * (i))));
        const futureDate = dateformat(newFutureDate, "dd-mm-yyyy")
        apiUrl = `${config.cowinApiUrl}api/v2/appointment/sessions/public/calendarByPin?pincode=${pincode}&date=${futureDate}`;
        console.log(`Making API Request: ${apiUrl}`);
        const response = await fetch(apiUrl);
        const newCenters = await response.json();
        centerList = await aggregateCentersSessions(centerList, newCenters)
      }
      // console.log(centerList);
      return await centerList;
    }
  } catch (error) {
    console.log(error.response);
  }
}

async function aggregateCentersSessions(centerList, newCenters) {
  let newList = []
  if(centerList.length == 0) {
    console.log("Adding New Data");
    centerList = newCenters
    return centerList
  }else {
    console.log("Already have data. adding sessions");
    for(let i = 0; i < newCenters.centers.length; i++) {
      for(let j = 0; j < centerList.centers.length; j++) {
        const newCenter = newCenters.centers[i];
        const oldCenter = centerList.centers[j];
        if(newCenter.center_id == oldCenter.center_id) {
          centerList.centers[j].sessions = [...centerList.centers[j].sessions, ...newCenter.sessions];
        }
      }
    }

    // Check for newly added centers
    let oldCenterIds = [];
    let newCenterIds = [];
    centerList.centers.forEach(oldCent => {
      oldCenterIds.push(oldCent.center_id);
    });

    newCenters.centers.forEach(newCent => {
      newCenterIds.push(newCent.center_id)
    });

    let absentCenterIds = newCenterIds.filter(e=>!oldCenterIds.includes(e));
    console.log(absentCenterIds);

    if(absentCenterIds.length > 0) {
      absentCenterIds.forEach(id => {
        newCenters.centers.forEach(cent => {
          if(cent.center_id == id) {
            console.log("Inserting New Center")
            centerList.centers.push(cent)
          }
        })
      })
    }

    return centerList
  }
}

router.get("/byPin", async function (req, res, next) {
  try {
    const pincode = req.query.pincode;
    const days = req.query.days;
    console.log(pincode,days);
    const centerInfo = await getCenterInfo(pincode, days);
    res.send(centerInfo);
  } catch (err) {
    console.error(`Error while getting stocks data`, err.message);
    next(err);
  }
});


module.exports = router;
