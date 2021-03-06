--  -------------------------------------------------- 
--  Generated by Enterprise Architect Version 7.5.849
--  Created On : Thursday, 27 June, 2013 
--  DBMS       : MySql 
--  -------------------------------------------------- 

DROP TABLE IF EXISTS Auction_Block_Item
;
CREATE TABLE Auction_Block_Item
(
	id INTEGER NOT NULL,
	auction_block_id INTEGER NOT NULL,
	item_id INTEGER NOT NULL,
	item_order INTEGER NOT NULL DEFAULT 999,
	FOREIGN KEY (auction_block_id) REFERENCES Auction_Block (id) ON DELETE CASCADE,
	FOREIGN KEY (item_id) REFERENCES Item (id) ON DELETE CASCADE
) 
;


