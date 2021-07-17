exports.up = function (knex) {
  return knex.schema
  .dropTableIfExists('reservations')
  .createTable("reservations", (table) => {
    table.increments("reservation_id").primary();
    table.string("first_name")
    table.string("last_name")
    table.string("mobile_number")
    table.string("reservation_date")
    table.time("reservation_time")
    table.integer("people")
    table.string('status')
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("reservations");
};
