
CREATE TABLE 'User_Role' ('id' INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, 'user_id' INTEGER NOT NULL, 'role_id' INTEGER NOT NULL, 'auction_group_id' INTEGER NOT NULL)
INSERT INTO "User_Role" ("id","user_id","role_id","auction_group_id") VALUES ('1','1','1','1');
INSERT INTO "User_Role" ("id","user_id","role_id","auction_group_id") VALUES ('2','2','2','1');