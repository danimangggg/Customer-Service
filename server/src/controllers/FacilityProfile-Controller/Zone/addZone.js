const db = require("../../../models");
const Zone = db.zone;
const path = require('path')

const addZone = (req, res) => {
    const result = Zone.create({
      region_name: req.body.region,
      zone_name: req.body.zone,
      });
        if(result){
        res.status(200).send({message:'zone created successfully'})
        }  
        }

module.exports = {
  addZone
};