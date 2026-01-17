const { DataTypes, sequelizeIntance } = require('../database/db.js');

const Tarea = sequelizeIntance.define('Tarea',{
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        AllowNull: false,
        validate: {
            notEmpty: {
                msg: "El titulo no puede estar vacio"
            }
        }
    },
    description:  {
        type: DataTypes.STRING,
        AllowNull: false
    },
    isCompleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'tareas',
    timestamps: true
})

module.exports = Tarea;

