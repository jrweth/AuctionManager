CREATE TABLE 'Role' ('id' INTEGER PRIMARY KEY NOT NULL, 'name' TEXT NOT NULL, 'description' TEXT NOT NULL);
INSERT INTO "Role" ("id","name","description") VALUES ('1','Admin','Can perform all functions for a given auction group');
INSERT INTO "Role" ("id","name","description") VALUES ('2','View Only','Has complete access but can only view for a given auction group');