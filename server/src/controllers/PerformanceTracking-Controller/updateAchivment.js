
const db = require("../../models");
const Achievement = db.achivement;

const updateFiles = async (req, res) => {
 
    const result = await Achievement.update(
      {
        achieved: req.body.achieved,
        remark: req.body.remark,
      
      },
      {
        where: {
          id: req.params.id,
        },
        }
      );
      if (result) {
        res.status(200).send({ message: 'Achievement updated successfully' });
      } else {
        res.status(404).send({ message: 'Achievement not found' });
      }
        }

module.exports = {
  updateFiles,
};
