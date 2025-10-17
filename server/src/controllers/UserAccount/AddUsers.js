
const db =  require('../../models')
const User = db.user;
const bcrypt = require('bcryptjs');


const AddUser = async (req, res) => {

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const result = User.create({
        first_name : req.body.first_name,
        last_name : req.body.last_name,
        user_name : req.body.user_name,
        password : hashedPassword,
        department : req.body.department,
        position : req.body.position,
        job_title : req.body.job_title,
        account_type : req.body.account_type
    });
    if(result){
       res.status(200).send({message:"user created successfully!!"}) 
    }
}

module.exports = {
    AddUser
}


