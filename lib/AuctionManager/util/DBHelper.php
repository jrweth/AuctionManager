<?php
namespace AuctionManager\util;

class DBHelper {
    /**
     * Return the next id
     * 
     * @param SQLite3 $db handle to the db
     * @param string $table
     * 
     * @return integer
     */
    public static function getNextId($db, $tableName) {
        //get the new id
        $sql = 'select max(id) as id from '. $tableName;
        $maxRow = $db->query($sql);
        
        if(!$maxRow) {
            throw new \Exception("Could not find a new id");
        }
        else {
            if ($row = $maxRow->fetchArray(SQLITE3_ASSOC)){
                $id = $row['id'] + 1;
            }
            else {
                $id = 1;
            }
        }
    }
}