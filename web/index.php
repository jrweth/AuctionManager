<?php 

require_once '../vendor/autoload.php';
$config = parse_ini_file('config/config.ini');



$loader = new Twig_Loader_Filesystem($config['projectRoot'].'template');
$twig = new Twig_Environment($loader);

class MyDB extends SQLite3
{
    function __construct()
    {
        $this->open('../db/auction.db');
    }
}

$db = new MyDB();

switch ($_REQUEST['dataType']) {

    case 'category': include $config['projectRoot'] . 'controller/category.php'; break;
    default:
        echo $twig->render('layout.html.twig', array('name' => 'Fabien'));
}



?>