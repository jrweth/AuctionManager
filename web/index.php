<?php 

//load config
$config = parse_ini_file('config/config.ini');
require_once '../vendor/autoload.php';


ini_set('include_path', ini_get('include_path').':'. $config['projectRoot'].'lib');

spl_autoload_register(
  function ($pClassName) {
    include(str_replace("\\", "/", $pClassName).'.php');
  }
);

error_reporting(E_ALL);

//load Twig
$loader = new Twig_Loader_Filesystem($config['projectRoot'].'lib/AuctionManager/template');
$twig = new Twig_Environment($loader);

//load db
$db = new SQLite3($config['projectRoot']. $config['dbPath']);

//route requests
switch ($_REQUEST['dataType']) {

    case 'category':
        $controller = new \AuctionManager\controller\Category($db, $twig);
        echo $controller->handleRequest($_REQUEST);
        break;
    default:
        echo $twig->render('layout.html.twig');
}



?>