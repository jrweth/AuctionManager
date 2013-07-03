<?php 

namespace AuctionManager\controller;

use \AuctionManager\util\DBHelper as DBHelper;

class Category extends Base
{

    public $dataTypeColumns = array(
        'id' => array('type' => 'id'),
        'name' => array('type' => 'string')
    );
    
    //handle the request
    public function handleRequest($request, $options)
    {
        switch ($request['action']) {
            case 'insert': 
                return $this->insert($request); break;
            case 'list':
            default:
                return $this->categoryList($request); break;
        }
    }
    
    public function insert($request)
    {
        //set up result object
        $result = array(
            'success' => false,
            'message' => 'An Error Occured',
            'data' => array()
        );
        try {
            //make sure name is defined
            if(!$request['data']['name']) {
                throw new \Exception('You must supply a name for the category.');
            }
            
            $id = DBHelper::getNextId($this->db, 'category');
            $result['data']['id'] = $id;
            
            //insert into the db
            $sql = 'INSERT INTO Category (id, auction_group_id, name) VALUES (' . $id  .",1,'" . $request['data']['name'] ."')";

            if($inserted = $this->db->exec($sql)) {
                $result['success'] = true;
                $result['message'] = 'Category successfully inserted';
            }
            else {
                throw new \Exception('The following database error occured: '. $this->db->lastErrorMsg());
            }
        }
        catch (\Exception $e) {
            $result['success'] = false;
            $result['message'] = $e->getMessage();
        }

        return json_encode($result);
        
    }
    
    /**
     * Returns the page for categories
     * @throws \Exception
     * @return string
     */
    public function categoryList()
    {
        try {
            $sql = 'SELECT ' .implode(', ' , array_keys($this->dataTypeColumns)) .' FROM Category ORDER BY name';
           
            $result = $this->db->query($sql);
            if(!$result) {
                throw new \Exception('Error Retrieving Categories from the database.');
            }
            else {
                $data = array();
                while($row = $result->fetchArray(SQLITE3_ASSOC)){
                    $data[] = $row;
                }
            }
        }
        catch (\Exception $e) {
            return $e->getMessage();
        }
        
        return $this->twig->render('category/list.html.twig', array('data' => $data));
    }
}
