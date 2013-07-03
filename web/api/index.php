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
    submitUpdate = function() {
        var formVars = $("#updateForm").serialize();
        $.ajax({
           url: "category/6",
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
    submitDelete = function() {
        var formVars = $("#updateForm").serialize();
        $.ajax({
           url: "category/5",
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
        <form action="category" method="post">
        <input name="name" />
        <input type="submit" />
        <input type="hidden" name="auction_group_id" value="1" />
        </form>
        update<form id="updateForm" action="category/6" method="put">
        <input name="name" /><a onclick="submitUpdate()">update</a>
        </form>
        <button onclick="submitDelete()">delete</button>
    </body></html>';
    });
    
    $app->get('/category', function () use ($db) {
        echo json_encode(DBHelper::getTableRecords($db, 'category'));
    });
    
    $app->get('/category/:id', function ($id) use ($db) {
        if($record = DBHelper::getTableRecord($db, 'category', $id)) {
            echo json_encode($record);
        }
        else {
            echo 'error';
        }
    });
    
    $app->post('/category', function () use ($db, $app) {
        if($id = DBHelper::insertTableRecord($db, 'category', $app->request()->post())) {
            outputResult('add', true, $id);
        }
        else {
            outputResult('add', false, null);
        }
    });
    
    
    $app->put('/category/:id', function ($id) use ($db, $app) {
        outputResult(
           'add',
           DBHelper::updateTableRecord($db, 'category', $id, $app->request()->post()),
           $id
        );
    });
    
    $app->delete('/category/:id', function ($id) use ($db) {
        outputResult(
           'delete',
           DBHelper::deleteTableRecord($db, 'category', $id),
           $id
        );
    });
    
    
    $app->run();