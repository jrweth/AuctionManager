<?php 

//load config
$config = parse_ini_file('config/config.ini');
require_once '../vendor/autoload.php';

//load Twig
$loader = new Twig_Loader_Filesystem($config['projectRoot'].'template');
$twig = new Twig_Environment($loader);

//load db
$db = new SQLite3($config['projectRoot']. $config['dbPath']);

//rout requests
switch ($_REQUEST['dataType']) {

    case 'category':
        include $config['projectRoot'] . 'controller/'.$_REQUEST['dataType'].'.php'; 
        break;
    default:
        echo $twig->render('layout.html.twig');
}



?>