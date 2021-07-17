
exports.up = function(knex) {
  return knex.schema
  .dropTableIfExists('tables')
  .createTable("tables", (table) => {
      table.increments("table_id").primary;
      table.string("table_name");
      table.integer("capacity");
      table.integer('reservation_id').unsigned().unique()
      table
        .foreign("reservation_id")
        .references("reservation_id")
        .inTable("reservations")
        .onDelete("CASCADE");
      table.timestamp(true, true)
  })
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists("tables")
};

/*

table
        .foreign("reservation_id")
        .references("reservation_id")
        .inTable("reservations")
        .onDelete("CASCADE");

reservations
reservation_id
*/