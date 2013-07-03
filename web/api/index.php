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
    //$app->contentType('application/json');
    
    //set up the db
    $db = new PDO('sqlite:' . $config['projectRoot'].$config['dbPath']);
    
    function outputResult($action, $success = true, $id = 0)
    {
        echo json_encode(array(
            'action' => $action,
            'success' => $success,
            'id' => intval($id),
        ));
    }
    
    $app->get('/', function () use($db) {
        echo '<html><head>
    <script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>
    <script type="text/javascript">
    submitUpdate = function(tableName) {
        var formVars = $("#updateForm").serialize();
        $.ajax({
           url: tableName + "/2",
           type: "PUT",
           data: formVars,
           dataType: "json",
           error: function(jqXHR, textStatus, errorThrow){
             alert("error");
             },
            success: function(data){
             alert(data);
           },
          });
          }
    submitDelete = function(tableName) {
        var formVars = $("#updateForm").serialize();
        $.ajax({
           url: tableName + "/2",
           type: "DELETE",
           dataType: "json",
           error: function(jqXHR, textStatus, errorThrow){
             alert("error");
             },
            success: function(data){
             alert(data.success);
           },
          });
          }
      </script>
    </head>
    <body>
        <h1>category</h1>
        <form action="category" method="post">
        <input name="name" />
        <input type="submit" />
        <input type="hidden" name="auction_group_id" value="1" />
        </form>
        update<form id="updateForm" action="category/6" method="put">
        <input name="name" /><a onclick="submitUpdate(\'category\')">update</a>
        </form>
        <button onclick="submitDelete(\'category\')">delete</button>
        <h1>auction group</h1>
        <form action="auction_group" method="post">
        <input name="name" />
        <input type="submit" />
        </form>
        update<form id="updateForm" action="auction_group/1" method="put">
        <input name="name" /><a onclick="submitUpdate()">update</a>
        </form>
        <button onclick="submitDelete(\'auction_group\')">delete</button>
    </body></html>';
    });
    
    $app->get('/:tableName', function ($tableName) use ($db) {
        echo json_encode(DBHelper::getTableRecords($db, $tableName));
    });
    
    $app->get('/:tableName/:id', function ($tableName, $id) use ($db) {
        if($record = DBHelper::getTableRecord($db, $tableName, $id)) {
            echo json_encode($record);
        }
        else {
            echo 'error';
        }
    });
    
    $app->post('/:tableName', function ($tableName) use ($db, $app) {
        if($id = DBHelper::insertTableRecord($db, $tableName, $app->request()->post())) {
            outputResult('add', true, $id);
        }
        else {
            outputResult('add', false, null);
        }
    });
    
    
    $app->put('/:tableName/:id', function ($tableName, $id) use ($db, $app) {
        outputResult(
           'add',
           DBHelper::updateTableRecord($db, $tableName, $id, $app->request()->post()),
           $id
        );
    });
    
    $app->delete('/:tableName/:id', function ($tableName, $id) use ($db) {
        outputResult(
           'delete',
           DBHelper::deleteTableRecord($db, $tableName, $id),
           $id
        );
    });
    
    
    $app->run();