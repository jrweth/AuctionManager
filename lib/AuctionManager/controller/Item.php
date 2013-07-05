<?php 

namespace AuctionManager\controller;

use \AuctionManager\util\DBHelper as DBHelper;

class Item extends Base
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
        return $this->twig->render('item/list.html.twig', array('pageTitle' => 'Item List'));
    }
}
