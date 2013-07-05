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
            if ($row = $maxRow->fetch(\PDO::FETCH_ASSOC)){
                $id = $row['id'] + 1;
            }
            else {
                $id = 1;
            }
        }
        
        return $id;
    }
    
    /**
     * Get all the table records
     *
     * @param PDO $db            handle to the db
     * @param string $tableName
     *
     * @return array
     */
    public static function getTableRecords($db, $tableName) {
        $sth = $db->query('SELECT * FROM ' .$tableName);
        return $sth->fetchAll(\PDO::FETCH_CLASS);
    }
    
    /**
     * Get the table record 
     * @param PDO $db
     * @param string $tableName
     * @param integer $id
     * 
     * @return array|null
     */
    public static function getTableRecord($db, $tableName, $id) {
        $sth = $db->query('SELECT * FROM ' .$tableName .' WHERE id = ? LIMIT 1;');
        $params = array(intval($id));
        $sth->execute($params);
        $records = $sth->fetchAll(\PDO::FETCH_CLASS);
        if(array_key_exists(0, $records)) {
            return $records[0];
        }
        else {
            return false;
        }
    }
    
    
    /**
     * Insert a record into a table 
     * @param PDO $db
     * @param string $tableName
     * @param array $values    associative array of values
     *
     * @return integer|null  the id of the inserted record
     */
    public static function insertTableRecord($db, $tableName, $values) {
        //get the id
        $id = self::getNextId($db, $tableName);
        $values['id'] = $id;
        
        //create the query and bind the values
        $sql = 'INSERT INTO ' . $tableName . '( ' . implode(', ', array_keys($values)) . ') ';
        $sql .= ' VALUES (' . str_repeat('?, ', count($values) -1 ) . ' ?)';
        $sth = $db->prepare($sql);
        $sth->execute(array_values($values));
        
        //return the id if successful
        if($sth->rowCount() == 1) {
            return $id;
        }
        else {
            return false;
        }
    }
    
    
    /**
     * Update a record in a table
     * @param PDO     $db         Handle to PDO
     * @param string  $tableName  Table Name
     * @param integer $id         Unique numeric id
     * @param array   $values     Associative array of field names and values
     *
     * @return boolean  flag indicating if the record was updated
     */
    public static function updateTableRecord($db, $tableName, $id, $values) {
    
        //create the query and bind the values
        $sql = 'UPDATE ' . $tableName . ' SET ';
        foreach($values as $fieldName => $value) {
            $sql .= $fieldName . ' = ?, ';
        }
        //strip off the last comma
        $sql = substr($sql, 0 , -2);
        
        //add id criteia
        $sql .= ' WHERE id = ' . intval($id);
        
        $stmt = $db->prepare($sql);
        $stmt->execute(array_values($values));
        //return the id if successful
        if($stmt->rowCount() == 1) {
            return true;
        }
        else {
            return false;
        }
    }
    
    
    /**
     * Delete a record in a table
     * @param PDO     $db         Handle to PDO
     * @param string  $tableName  Table Name
     * @param integer $id         Unique numeric id
     *
     * @return boolean  flag indicating if the record was deleted
     */
    public static function deleteTableRecord($db, $tableName, $id) {
    
        //create the query and bind the values
        $sql = 'DELETE FROM ' . $tableName . ' WHERE ID = ? ';
        $sth = $db->prepare($sql);
        $sth->execute(array($id));
    
        //return the id if successful
        if($sth->rowCount() == 1) {
            return true;
        }
        else {
            return false;
        }
    }
}