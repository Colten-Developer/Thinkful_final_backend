const service = require('./tables.service')
const asyncErrorBoundary = require('../errors/asyncErrorBoundary')
const hasProperties = require('../errors/hasProperties')
const { table } = require('../db/connection')

const hasRequiredProperties = hasProperties('table_name', 'capacity')

const VALID_PROPERTIES = ['table_name', 'capacity', 'reservation_id', 'table_id', 'people']

function hasOnlyValidProperties(req, res, next) {
    const { data = {} } = req.body;
  
    const invalidFields = Object.keys(data).filter(
      (field) => !VALID_PROPERTIES.includes(field)
    );
  
    if (invalidFields.length) {
      return next({
        status: 400,
        message: `Invalid field(s): ${invalidFields.join(", ")}`,
      });
    }
    next();
  }

function validateProperties(req, res, next) {
    let tableName = req.body.data.table_name
    let capacity = req.body.data.capacity

    if(!tableName){
        return next({ status: 400, message: 'table_name is missing'})
    }

    if(tableName.length < 2){
        return next({ status: 400, message: 'table_name is too short'})
    }

    if(isNaN(capacity)){
        return next({ status: 400, message: 'capacity must be a number'})
    }

    if(capacity < 1){
        return next({ status: 400, message: 'capacity must be greater than 0'})
    }
    return next()
}

async function validatePropertiesUpdate(req, res, next) {
    if(!req.body.data){
        return next({ status: 400, message: `data is missing`})
    }
    if(!req.body.data.reservation_id){
        return next({ status: 400, message: `reservation_id is missing`})
    }

    const reservation = await service.readReservation(req.body.data.reservation_id)
    if(!reservation) {
        return next({ status: 404, message: `reservation ${req.body.data.reservation_id} does not exist`})
    }
    if(reservation.people > res.locals.table.capacity) {
        return next({ status: 400, message: `table does not have the capacity to hold this reservation`})
    }

    if(res.locals.table.reservation_id != null) {
        return next({ status: 400, message: `occupied`})

    }
    if(reservation.status == 'seated'){
        return next({ status: 400, message: `table already seated`})
    }

    return next()
}

async function tableExists(req, res, next) {
    const { tableId } = req.params
  
    const table = await service.read(tableId)
  
    if (table){
        res.locals.table = table
        return next()
    }
    next({ status: 404, message: `Table id ${tableId} does not exist`})
  }

async function tableOccupied(req, res, next) {

    if(res.locals.table.reservation_id){
        return next()
    }
    next({ status: 400, message: `The table is not occupied.`})
}

async function read(req, res, next) {
    const { table: data } = res.locals
    res.json({ data })
}

async function list(req, res, next) {
    const data = await service.list()
    res.json({ data })
}

async function create(req, res, next) {
    let newData = req.body.data
    service
        .create(req.body.data)
        .then((data) => res.status(201).json({ data: newData }))
        .catch(next)
}

async function update(req, res, next) {
    const updatedTable = {
        ...res.locals.table,
        ...req.body.data,
        table_id: res.locals.table.table_id
    }

    const data = await service.update(updatedTable)
    res.status(200).json({ data })
}

async function tableAvailable(req, res, next) {
    const data = await service.destroyAvailability(res.locals.table.table_id)
    data[0].reservation_id = null
    const updatedTable = await service.update(data[0])
    res.status(200).json({ data: data[0] })
}

async function reservationSeated(req, res, next) {
    const reservation = await service.readReservation(req.body.data.reservation_id)

    reservation.status = 'seated'
    const data = await service.updateReservation(reservation)
    return next()
}

async function reservationFinished(req, res, next) {
    const reservation = await service.readReservation(res.locals.table.reservation_id)
    
    reservation.status = 'finished'
    await service.updateReservation(reservation)
    return next()
}


module.exports = {
    read: [asyncErrorBoundary(tableExists), asyncErrorBoundary(read)],
    list: asyncErrorBoundary(list),
    create: [hasOnlyValidProperties, hasRequiredProperties, validateProperties, asyncErrorBoundary(create)],
    update: [asyncErrorBoundary(tableExists), validatePropertiesUpdate, asyncErrorBoundary(reservationSeated), asyncErrorBoundary(update)],
    delete: [asyncErrorBoundary(tableExists), asyncErrorBoundary(tableOccupied), asyncErrorBoundary(reservationFinished), asyncErrorBoundary(tableAvailable)],
}
