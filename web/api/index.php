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
$app->contentType('application/json');

//set up the db
$db = new PDO('sqlite:' . $config['projectRoot'].$config['dbPath']);
$db->exec('PRAGMA foreign_keys = ON');

function outputResult($action, $success = true, $id = 0)
{
    echo json_encode(array(
        'action' => $action,
        'success' => $success,
        'id' => intval($id),
    ), JSON_NUMERIC_CHECK);
}

$app->get('/', function () use($db) {
    echo '';
});

$app->get('/:tableName', function ($tableName) use ($db) {
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

$app->get('/:tableName/:id', function ($tableName, $id) use ($db, $app) {
    if($record = DBHelper::getTableRecord($db, $tableName, $id)) {
        echo json_encode($record, JSON_NUMERIC_CHECK);
    }
    else {
        $app->halt(500, 'An Error Occured trying to retrieve the records.');
    }
});

$app->post('/:tableName', function ($tableName) use ($db, $app) {
    $values = json_decode($app->request()->getBody(), true);
    if($id = DBHelper::insertTableRecord($db, $tableName, $values)) {
        $values['id'] = $id;
        echo json_encode($values, JSON_NUMERIC_CHECK);
    }
    else {
        $app->halt(500, 'An Error Occured trying to save the new record.');
    }
});


$app->put('/:tableName/:id', function ($tableName, $id) use ($db, $app) {
    $values = json_decode($app->request()->getBody(), true);
    if(DBHelper::updateTableRecord($db, $tableName, $id, $values)) {
        echo json_encode($values, JSON_NUMERIC_CHECK);
    }
    else {
        $app->halt(500, 'An Error Occured trying to save the record.');
    }
});

$app->delete('/:tableName/:id', function ($tableName, $id) use ($db) {
    if(!DBHelper::deleteTableRecord($db, $tableName, $id)) {
        $app->halt(500, 'An Error Occured trying to delete the record.');
    }
    else {
        echo '{}';
    }
});


$app->run();