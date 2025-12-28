const db = require("../../../models");
const Facility = db.facility;

// UPDATE the route and period of a facility
const updateFacility = (req, res) => { 
  const id = req.params.id;

  // We only allow updating route and period for security
  const updateData = {
    route: req.body.route,
    period: req.body.period
  }; 

  Facility.update(updateData, {
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({ message: "Facility was updated successfully." });
      } else {
        res.send({ message: `Cannot update Facility with id=${id}.` });
      }
    })
    .catch(err => {
      res.status(500).send({ message: "Error updating Facility with id=" + id });
    });
};

// DELETE a facility
const deleteFacility = (req, res) => {
  const id = req.params.id;

  Facility.destroy({ where: { id: id } })
    .then(num => {
      if (num == 1) {
        res.send({ message: "Facility deleted successfully!" });
      } else {
        res.send({ message: `Cannot delete Facility with id=${id}.` });
      }
    })
    .catch(err => {
      res.status(500).send({ message: "Could not delete Facility" });
    });
};

module.exports = {
    updateFacility,
    deleteFacility,  
  };