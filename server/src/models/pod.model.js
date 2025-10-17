module.exports = (sequelize, DataTypes) => {
    const Pod = sequelize.define("Pods", {
     
      region: {
        type: DataTypes.STRING,
      },
      zone_Subcity: {
        type: DataTypes.STRING,
      },
      woreda: {
        type: DataTypes.STRING,
      },
      facilityName: {
        type: DataTypes.STRING,
      },
      dn_no: {
        type: DataTypes.STRING,
      },
      order_no: {
        type: DataTypes.STRING,
      },
      manual_dno: {
        type: DataTypes.STRING,
      },
      pod_no: {
        type: DataTypes.STRING,
      },
      registered_by: {
        type: DataTypes.STRING,
      },
      received_by: {
        type: DataTypes.STRING,
      },
      date: {
        type: DataTypes.STRING,
      },
      image: {
        type: DataTypes.STRING,
      },
    });
  
    return Pod;
  };
  