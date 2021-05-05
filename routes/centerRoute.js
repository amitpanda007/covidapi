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

async function getDistrictCenterInfo(districtId, days) {
  var centerList = [];
  var apiUrl;
  try {
    const weeks = Math.floor(days/7)
    if(weeks == 0) {
      const today = new Date();
      const newDate = dateformat(today, "dd-mm-yyyy")
      //https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=446&date=03-05-2021
      apiUrl = `${config.cowinApiUrl}api/v2/appointment/sessions/public/calendarByDistrict?district_id=${districtId}&date=${newDate}`;
      const response = await fetch(apiUrl);
      const centers = await response.json();
      return centers
    }else {
      for(let i = 0; i < weeks; i ++) {
        console.log(i);
        const today = new Date();
        var newFutureDate = new Date(today.setDate(today.getDate() + (7 * (i))));
        const futureDate = dateformat(newFutureDate, "dd-mm-yyyy")
        apiUrl = `${config.cowinApiUrl}api/v2/appointment/sessions/public/calendarByDistrict?district_id=${districtId}&date=${futureDate}`;
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

async function filterByMinMaxAgeLimit(centerInfo, minAgeLimit, maxAgeLimit) {
  const filteredCenter = centerInfo.centers.filter(cent => cent.sessions[0].min_age_limit >= minAgeLimit && cent.sessions[0].min_age_limit <= maxAgeLimit);
  let finalData = {"centers": []};
  finalData.centers = [...filteredCenter];
  return finalData;
}

async function filterByMinAgeLimit(centerInfo, minAgeLimit) {
  // let filteredCenters = [];

  for(let i = 0; i < centerInfo.centers.length; i++) {
    const curCenter = centerInfo.centers[i];
    if(curCenter.sessions[0].min_age_limit <= minAgeLimit) {
      centerInfo.centers.splice(i, 1);
    }
  }
  return centerInfo;
}

async function filterByAvailableLimit(centerInfo, availableCapacity) {
  const finalData = {"centers": []};
  const centerData = [];
  centerInfo.centers.forEach(cent => {
    const filteredSessions = cent.sessions.filter(sess => sess.available_capacity >= availableCapacity)
    cent.sessions = filteredSessions;
    centerData.push(cent);
  });
  finalData.centers = [...centerData];

  //Remove Empty session centers
  const finalCenterList = finalData.centers.filter(centr => centr.sessions.length > 0) 

  return finalCenterList;
}

router.get("/byPin", async function (req, res, next) {
  try {
    const pincode = req.query.pincode;
    const days = req.query.days;
    console.log(pincode,days);
    const centerInfo = await getCenterInfo(pincode, days);
    res.send(centerInfo);
  } catch (err) {
    console.error(`Error while getting data`, err.message);
    next(err);
  }
});

router.get("/byDistrict", async function (req, res, next) {
  try {
    const districtId = req.query.district_id;
    const days = req.query.days;
    console.log(districtId,days);
    const centerInfo = await getDistrictCenterInfo(districtId, days);
    res.send(centerInfo);
  } catch (err) {
    console.error(`Error while getting data`, err.message);
    next(err);
  }
});


router.get("/avlByPin", async function (req, res, next) {
  try {
    const pincode = req.query.pincode;
    const minAgeLimit = req.query.min_age;
    const maxAgeLimit = req.query.max_age;    
    const days = req.query.days;
    const availableCapacity = req.query.available_capacity;

    if(pincode == undefined || minAgeLimit == undefined || maxAgeLimit == undefined || days == undefined || availableCapacity == undefined) {
      const message = {
        error: "Missing Required Query Params. Please provide query params (pincode, min_age, max_age, days, available_capacity)"
      }
      res.send(message);
    }

    console.log(`Query Params: PIN: ${pincode}, Days: ${days}, Min Age Limit: ${minAgeLimit}, Available Capacity: ${availableCapacity}`);
    const centerInfo = await getCenterInfo(pincode, days);
    const filteredAgeCenter = await filterByMinMaxAgeLimit(centerInfo, minAgeLimit, maxAgeLimit);
    const filteredAvailableCenter = await filterByAvailableLimit(filteredAgeCenter, availableCapacity);
    res.send(filteredAvailableCenter);
  } catch (err) {
    console.error(`Error while getting data`, err.message);
    next(err);
  }
});


router.get("/avlByDist", async function (req, res, next) {
  try {
    const districtId = req.query.district_id;
    const minAgeLimit = req.query.min_age;
    const maxAgeLimit = req.query.max_age;
    const days = req.query.days;
    const availableCapacity = req.query.available_capacity;

    if(districtId == undefined || minAgeLimit == undefined || maxAgeLimit == undefined || days == undefined || availableCapacity == undefined) {
      const message = {
        error: "Missing Required Query Params. Please provide query params (district_id, min_age, max_age, days, available_capacity)"
      }
      res.send(message);
    }

    console.log(`Query Params: District Code: ${districtId}, Days: ${days}, Min Age Limit: ${minAgeLimit}, Max Age Limit: ${maxAgeLimit}, Available Capacity: ${availableCapacity}`);
    const centerInfo = await getDistrictCenterInfo(districtId, days);
    const filteredAgeCenter = await filterByMinMaxAgeLimit(centerInfo, minAgeLimit, maxAgeLimit);
    const filteredAvailableCenter = await filterByAvailableLimit(filteredAgeCenter, availableCapacity);
    res.send(filteredAvailableCenter);
  } catch (err) {
    console.error(`Error while getting data`, err.message);
    next(err);
  }
});

module.exports = router;
