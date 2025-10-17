const db = require("../../../models");
const Facility = db.facility;

const addFacility = (req, res) => {
   const result = Facility.create({
      region_name: req.body.region_name,
      zone_name: req.body.zone_name,
      woreda_name: req.body.woreda_name,
      facility_name: req.body.facility_name,
      facility_type: req.body.facility_type
      });
      if(result){
        res.status(200).send({message:'Facility created successfully'})
          }
        }

module.exports = {
  addFacility
};