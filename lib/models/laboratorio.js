'use strict';
module.exports = (sequelize, DataTypes) => {
  const Laboratorio = sequelize.define(
    'Laboratorio',
    {
      nombre: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      capacidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      edificio: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      // Esto es importante para que Sequelize sepa que la tabla
      // se llama exactamente "Laboratorios" (como la pusimos en la migración)
      tableName: 'Laboratorios',
      timestamps: true,
    }
  );

  return Laboratorio;
};
