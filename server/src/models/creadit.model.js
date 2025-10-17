module.exports = (sequelize, DataTypes) => {
  const Creadit = sequelize.define("Facility-Data", {
    fiscalYear: {
      type: DataTypes.STRING,
    },
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
    facilityDeligate: {
      type: DataTypes.STRING,
    },
    creaditAmount: {
      type: DataTypes.STRING,
    },
    image: {
      type: DataTypes.STRING,
    },
  });

  return Creadit;
};
