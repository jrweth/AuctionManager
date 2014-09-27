<?php 

//load config
$config = parse_ini_file('config/config.ini');

//set path
ini_set('include_path', ini_get('include_path').':'. $config['projectRoot'].'lib');
ini_set('include_path', ini_get('include_path').':'. $config['projectRoot'].'vendor/slim/slim');

//get the composer autoloader
require_once $config['projectRoot'].'vendor/autoload.php';

//add standard autoloader
spl_autoload_register(
  function ($pClassName) {
    include(str_replace("\\", "/", $pClassName).'.php');
  }
);
//add the slim project and autoloader
require $config['projectRoot'].'vendor/slim/slim/Slim/Slim.php';
Slim\Slim::registerAutoloader();

session_start();

//set up the slim app 
$app = new \Slim\Slim();
$app->add(new \Slim\Middleware\SessionCookie(array('secret' => 'hereismysecretthing')));

//load Twig
$loader = new Twig_Loader_Filesystem($config['projectRoot'].'lib/AuctionManager/template');
$twig = new Twig_Environment($loader);
$twig->addGlobal('webRoot', $config['webRoot']);
$twig->addExtension(new \AuctionManager\util\AutoLinkTwigExtension());

//load db
$db = new PDO('sqlite:' . $config['projectRoot'].$config['dbPath']);

//wrap all setup objects in a container for dependecy injection
$container = array(
    'config' => $config,
    'app' => $app,
    'twig' => $twig,
    'db' => $db
 );

//set up the routing
$appRouter = new AuctionManager\app\AppRouter($container);
$appRouter->route();

//run the application
$app->run();

?>