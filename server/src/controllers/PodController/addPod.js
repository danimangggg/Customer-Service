
const db = require("../../models");
const Pod = db.pod;

const addPod = (req, res) => {

    if (req.file == undefined) {
      return res.send(`You must select a file.`);
    }
    
    const result = Pod.create({ 
      region: req.body.region,
      zone_Subcity: req.body.zone_Subcity,
      woreda: req.body.woreda,
      facilityName: req.body.facilityName,
      dn_no: req.body.dnNo,
      order_no: req.body.orderNo,
      manual_dno: req.body.manualDeliveryNo,
      pod_no: req.body.podNo,
      registered_by: req.body.registeredBy,
      received_by: req.body.receivedBy,
      date: req.body.date,
      image: req.file.filename
      })
        if(result){
          res.status(200).send({message:"pod created succesfully"})
        }
          }

module.exports = {
  addPod
};
