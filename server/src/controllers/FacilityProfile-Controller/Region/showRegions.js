
const db = require("../../../models");
const Regions = db.region;
const express = require('express')
const app = express()


app.use(express.json())
const retriveRegions = (req, res) => {

    Regions.findAll({
    }).then(data => {
      var jsonArray = [];
          data.forEach((element)=>{
            jsonArray.push(element.toJSON());
          });
          console.log(jsonArray);
          res.send(jsonArray)
          }).catch ((error) => {
    console.log(error);
    return res.send(`Error when trying fetchin regions: ${error}`);
          })
      }

module.exports = {
  retriveRegions
};