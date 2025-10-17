

const db = require("../../models");
const Pod = db.pod;

const updatePod = async (req, res) => {
 
    const result = await Pod.update(
      {
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
        //image: req.file.filename
      
      },
      {
        where: {
          id: req.params.id,
        },
        }
      );
      if (result) {
        res.status(200).send({ message: 'Item updated successfully' });
      } else {
        res.status(404).send({ message: 'Item not found' });
      }
        }

module.exports = {
  updatePod,
};
