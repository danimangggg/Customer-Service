

const db = require("../../models");
const Creadit = db.creadit;

const updateFiles = async (req, res) => {
 
    const result = await Creadit.update(
      {
      fiscalYear: req.body.fiscalYear,
      region: req.body.region,
      zone_Subcity: req.body.zone_Subcity,
      woreda: req.body.woreda,
      facilityName: req.body.facilityName,
      facilityDeligate: req.body.facilityDeligate,
      creaditAmount: req.body.creaditAmount,
      
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
  updateFiles,
};
