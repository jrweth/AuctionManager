--  -------------------------------------------------- 
--  Generated by Enterprise Architect Version 7.5.849
--  Created On : Thursday, 27 June, 2013 
--  DBMS       : MySql 
--  -------------------------------------------------- 

DROP TABLE IF EXISTS Auction_Group
;
CREATE TABLE Auction_Group
(
	id INTEGER NOT NULL,
	name VARCHAR(100) NOT NULL,
	username VARCHAR(100),
	password VARCHAR(100),
	PRIMARY KEY (id)
) 
;


