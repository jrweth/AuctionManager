--  -------------------------------------------------- 
--  Generated by Enterprise Architect Version 7.5.849
--  Created On : Thursday, 27 June, 2013 
--  DBMS       : MySql 
--  -------------------------------------------------- 

DROP TABLE IF EXISTS Item
;
CREATE TABLE Item
(
	id INTEGER NOT NULL,
	auction_id INTEGER NOT NULL,
	title VARCHAR(255) NOT NULL,
	donor_display_name VARCHAR(255) NOT NULL,
	description_for_booklet TEXT,
	description TEXT,
	date_received DATE,
	category_id INTEGER,
	value INTEGER,
	min_bid INTEGER,
	item_location VARCHAR(255),
	donor_thanked_by VARCHAR(255),
	donor_committee_contact VARCHAR(100),
	featured_item boolean DEFAULT 'no' NOT NULL,
	public_display_item VARCHAR(10) DEFAULT 'no' NOT NULL,
	item_order_number NUMBER,
	auction_block_id INTEGER,
	notes TEXT,
	image_url VARCHAR(255),
	PRIMARY KEY (id),
	FOREIGN KEY (auction_id) REFERENCES Auction (id) ON DELETE CASCADE,
	FOREIGN KEY (category_id) REFERENCES Category (id) ON DELETE SET NULL,
	FOREIGN KEY (auction_block_id) REFERENCES Auction_Block (id) ON DELETE SET NULL
) 
;



