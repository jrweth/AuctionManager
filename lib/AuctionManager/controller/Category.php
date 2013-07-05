<?php 

namespace AuctionManager\controller;

use \AuctionManager\util\DBHelper as DBHelper;

class Category extends Base
{

    public $dataTypeColumns = array(
        'id' => array('type' => 'id'),
        'name' => array('type' => 'string')
    );
    
    /**
     * Returns the page for categories
     * @throws \Exception
     * @return string
     */
    public function listAction()
    {
        try {
            $data = DBHelper::getTableRecords($this->container['db'], 'category');
        }
        catch (\Exception $e) {
            return $e->getMessage();
        }
        
        return $this->twig->render('category/list.html.twig', array('pageTitle' => 'Category List', 'data' => $data));
    }
}
