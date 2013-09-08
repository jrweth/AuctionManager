<?php
use \AuctionManager\util\DBHelper;

//get config for correct paths
$config = parse_ini_file('../config/config.ini');

//set the include path for the project lib
ini_set('include_path', ini_get('include_path').':'. $config['projectRoot'].'lib');

//set autoloader for typical class hierarch
spl_autoload_register(function ($pClassName) {
    include(str_replace("\\", "/", $pClassName).'.php');
}
);

//get the composer autoloader
require_once $config['projectRoot'].'vendor/autoload.php';

//add the slim project and autoloader
require $config['projectRoot'].'vendor/slim/slim/Slim/Slim.php';
Slim\Slim::registerAutoloader();

//set up the slim app and the 
$app = new Slim\Slim();
$app->add(new \Slim\Middleware\SessionCookie(array('secret' => 'hereismysecretthing')));
$app->contentType('application/json');

$app->expires('-1 day');

//set up the db
$db = new PDO('sqlite:' . $config['projectRoot'].$config['dbPath']);
$db->exec('PRAGMA foreign_keys = ON');


$authenticate = function ($app) {
    return function () use ($app) {
        if (!isset($_SESSION['user'])) {
            $app->halt(500, 'You are not currently logged on.');
        }
    };
};


$app->get('/', $authenticate($app), function () use($db) {
    echo '';
});

$app->get('/:tableName', $authenticate($app), function ($tableName) use ($db) {
    switch($tableName) {
        case 'contact': $orderBy = 'first_name, last_name, organization_name'; break;
        case 'affiliation': $orderBy = 'name'; break;
        case 'category': $orderBy = 'name'; break;
        case 'item': $orderBy = 'title'; break;
        case 'auction': $orderBy = 'auction_block_order'; break;
        case 'auction_block_item': $orderBy = 'item_order'; break;
        default: $orderBy = null;
    }
    echo json_encode(DBHelper::getTableRecords($db, $tableName, $orderBy), JSON_NUMERIC_CHECK);
});

$app->get('/:tableName/:id', $authenticate($app), function ($tableName, $id) use ($db, $app) {
    if($record = DBHelper::getTableRecord($db, $tableName, $id)) {
        echo json_encode($record, JSON_NUMERIC_CHECK);
    }
    else {
        $app->halt(500, 'An Error Occured trying to retrieve the records.');
    }
});

$app->post('/:tableName', $authenticate($app), function ($tableName) use ($db, $app) {
    $values = json_decode($app->request()->getBody(), true);
    
    if ($tableName == 'bidder' && !array_key_exists('bidder_number', $values)) {
        $sql = 'select max(bidder_number) as max_bidder from bidder where auction_id = ' . intval($values['auction_id']);
        $sth = $db->query($sql);
        $records = $sth->fetchAll(\PDO::FETCH_CLASS);
        if(array_key_exists(0, $records)) {
            $values['bidder_number'] = $records[0]->max_bidder + 1;
        }
        else {
            $values['bidder_number'] = 1;
        }
    }
    
    if($id = DBHelper::insertTableRecord($db, $tableName, $values)) {
        $values['id'] = $id;
        echo json_encode($values, JSON_NUMERIC_CHECK);
    }
    else {
        $app->halt(500, 'An Error Occured trying to save the new record.');
    }
});


$app->put('/:tableName/:id', $authenticate($app), function ($tableName, $id) use ($db, $app) {
    $values = json_decode($app->request()->getBody(), true);
    if(DBHelper::updateTableRecord($db, $tableName, $id, $values)) {
        echo json_encode($values, JSON_NUMERIC_CHECK);
    }
    else {
        $app->halt(500, 'An Error Occured trying to save the record.');
    }
});

$app->delete('/:tableName/:id', $authenticate($app), function ($tableName, $id) use ($db) {
    if(!DBHelper::deleteTableRecord($db, $tableName, $id)) {
        $app->halt(500, 'An Error Occured trying to delete the record.');
    }
    else {
        echo '{}';
    }
});


$app->run();