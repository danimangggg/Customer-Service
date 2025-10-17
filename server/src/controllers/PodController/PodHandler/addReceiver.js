
const db = require("../../../models");
const Receiver = db.receiver;

const addReceiver = (req, res) => {
   const result = Receiver.create({
            receiver: req.body.receiver,
          });
          if(result){
            res.status(200).send({message:'Receiver created'})
          }
          
        }

module.exports = {
  addReceiver
};
