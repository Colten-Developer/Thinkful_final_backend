const knex = require('../db/connection')

function create(reservation) {
    return knex("reservations").insert(reservation).returning("*");
  }

  function list() {
    return knex("reservations").select("*").orderBy('reservation_time');
  }

  function read(reservationId) {
    return knex('reservations')
      .select('*')
      .where({ 'reservation_id': reservationId })
      .first()
}

function listDate(date) {
    return knex('reservations')
    .select('*')
    .where({ 'reservation_date': date })
    //.whereNot({ 'status': 'finished' })
    .orderBy('reservation_time')
}

function listNumber(number) {
  return knex('reservations')
    .select('*')
    .where('mobile_number', 'like', `%${number}%`)
}

function update(updatedReservation) {
  return knex('reservations')
    .select('*')
    .where({ reservation_id: updatedReservation.reservation_id})
    .update(updatedReservation, '*')
}

module.exports = {
    create,
    list,
    listDate,
    read,
    listNumber,
    update,
}