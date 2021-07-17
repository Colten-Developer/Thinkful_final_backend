/**
 * List handler for reservation resources
 */
const service = require('./reservations.service')
const asyncErrorBoundary = require('../errors/asyncErrorBoundary')
const hasProperties = require('../errors/hasProperties')

const VALID_PROPERTIES = [
  'reservation_id',
  'first_name',
  'last_name',
  'mobile_number',
  'reservation_date',
  'reservation_time',
  'people',
  'status',
  'created_at',
  'updated_at'
]

const hasRequiredProperties = hasProperties('first_name', 'last_name', 'mobile_number', 'reservation_date', 'reservation_time', 'people')

function hasOnlyValidProperties(req, res, next) {
  const { data = {} } = req.body;

  const invalidFields = Object.keys(data).filter(
    (field) => !VALID_PROPERTIES.includes(field)
  );

  if (invalidFields.length)
    return next({
      status: 400,
      message: `Invalid field(s): ${invalidFields.join(", ")}`,
    });
  next();
}

//validates that properties are appropriate types
function validateProperties(req, res, next) {
  let date = req.body.data.reservation_date
  //function to see if the value is a date
  const isDate = (value) => {
    return (new Date(value) !== "invalid Date" && !isNaN(new Date(value)))
  } 

  let time = req.body.data.reservation_time
  if(!time) {
    return next({
      status: 400,
      message: `reservation_time`
    })
  }
  let timeArray = time.split(':')
  let people = req.body.data.people

  //the reservation date is a date
  if(!isDate(date)){
    return next({
      status: 400,
      message: `reservation_date`
    })
  }
  //the inputted date object
  let dateObject = new Date(date)
  //todays date
  let today = new Date()
  //todays date object formatted
  let todayDateObject = today.getFullYear() + '-' + (today.getMonth()+1) + '-' + today.getDay()
  //finds what today is in a numeric form, mon = 0, tues = 1, wed =2 
  let numberDate = dateObject.getDay()
  
  //if today is tuesday were closed
  if(numberDate == 1){
    return next({
      status: 400,
      message: `closed`
    })
  }
  //if the date inputted is in the past
  if(dateObject < new Date()){
    return next({
      status: 400,
      message: `the reservation must be in the future`
    })
  }

  //checks if reservations time is a time
  if(timeArray.length < 2){
    return next({
      status: 400,
      message: `reservation_time must be a time`
    })
  }
  //checks if people is a number
  if(typeof people != 'number' || people === 0){
    return next({
      status: 400,
      message: `people must be a number greater than 0`
    })
  }

  //checks if time is available 
  let hours = Number(timeArray[0])
  let minutes = Number(timeArray[1])
  if(hours <= 10){
    if(hours == 10 && minutes < 30){
      return next({
        status: 400,
        message: `the reservation is too early`
      })
    }
    if(hours < 10){
      return next({
        status: 400,
        message: `the reservation is too early`
      })
    }
  }

  if(hours >= 21){
    if(hours == 21 && minutes > 30){
      return next({
        status: 400,
        message: `the reservation is too late`
      })
    }
    if(hours > 21) {
      return next({
        status: 400,
        message: `the reservation is too late`
      })
    }
  }

  
  //if every type is valid continue down the list
  next()
}

function validateUpdatedProperties(req, res, next) {
  let firstName = req.body.data.first_name
  let lastName = req.body.data.last_name
  let mobileNumber = req.body.data.mobile_number
  let reservationTime = req.body.data.reservation_time

  if(!firstName){
    return next({
      status: 400,
      message: `first_name cannot be empty or missing`
    })
  }

  if(!lastName){
    return next({
      status: 400,
      message: `last_name cannot be empty or missing`
    })
  }

  if(!mobileNumber){
    return next({
      status: 400,
      message: `mobile_number cannot be empty or missing`
    })
  }

  if(!reservationTime){
    return next({
      status: 400,
      message: `reservation_time cannot be empty or missing`
    })
  }

  return next()
}

async function reservationExists(req, res, next) {
  const { reservation_id } = req.params

  const reservation = await service.read(reservation_id)
  
  if (reservation){
      res.locals.reservation = reservation
      return next()
  }
  next({ status: 404, message: `reservation id ${reservation_id} cannot be found.`})
}

async function read(req, res) {
  const { reservation: data } = res.locals
  res.status(200).json({ data })
}

async function list(req, res, next) {
  if(req.query.date){
    const data = await service.listDate(req.query.date)
    return res.json({ data })
  }
  if(req.query.mobile_number){
    const data = await service.listNumber(req.query.mobile_number)
    return res.json({ data })
  }
  const data = await service.list()
  return res.json({ data })
}

function create(req, res, next) {
  if(req.body.data.status === 'seated'){
    return next({
      status: 400,
      message: `table already seated`
    })
  }
  if(req.body.data.status === 'finished'){
    return next({
      status: 400,
      message: `table already finished`
    })
  }
  service
    .create(req.body.data)
    .then((data) => res.status(201).json({ data: data[0] }))
    .catch(next);
}

async function reservationStatus(req, res, next) {
  if(req.body.data.status == 'cancelled') {
    return next()
  }
  if(res.locals.reservation.status === 'finished'){
    return next({
      status: 400,
      message: `a finished table cannot be updated`
    })
  }
  if(req.body.data.status == 'booked'){
    return next()
  } else if(req.body.data.status == 'seated'){
    return next()
  } else if(req.body.data.status == 'finished'){
    return next()
  }else {
    return next({
      status: 400,
      message: `reservation status is unknown`
    })
  }
}

async function updateReservation(req, res, next) {
  const updatedReservation = {
    ...res.locals.reservation,
    ...req.body.data,
    reservation_id: res.locals.reservation.reservation_id
  }

  const data = await service.update(updatedReservation)
  res.status(200).json({ data: data[0] })
}

async function updateStatus(req, res, next) {
  const updatedReservation = {
    ...res.locals.reservation,
    ...req.body.data,
    reservation_id: res.locals.reservation.reservation_id
  }
  const data = await service.update(updatedReservation)
  res.status(200).json({ data: data[0] })
}

module.exports = {
  read: [asyncErrorBoundary(reservationExists), asyncErrorBoundary(read)],
  list: [asyncErrorBoundary(list)],
  create: [hasOnlyValidProperties,
     hasRequiredProperties,
     validateProperties,
     asyncErrorBoundary(create)],
  update: [asyncErrorBoundary(reservationExists),
     validateProperties, 
     validateUpdatedProperties, 
     hasOnlyValidProperties, 
     asyncErrorBoundary(updateReservation)
    ],
  updateStatus: [asyncErrorBoundary(reservationExists),
     asyncErrorBoundary(reservationStatus),
    asyncErrorBoundary(updateStatus)]
};
