
const db = require("../models");
const Creadit = db.creadit;

const uploadFiles = (req, res) => {
    if (req.file == undefined) {
      return res.send(`You must select a file.`);
    }
    
    const result = Creadit.create({
      fiscalYear: req.body.fiscalYear,
      region: req.body.region,
      zone_Subcity: req.body.zone_Subcity,
      woreda: req.body.woreda,
      facilityName: req.body.facilityName,
      facilityDeligate: req.body.facilityDeligate,
      creaditAmount: req.body.creaditAmount,
      image: req.file.filename
      });
      if(result){
        res.status(200).send({message:"contract created"})
      }
        }

module.exports = {
  uploadFiles,
};
