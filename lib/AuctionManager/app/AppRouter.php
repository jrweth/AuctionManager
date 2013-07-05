<?php 
namespace AuctionManager\app;

class AppRouter
{
    /** @var array */
    protected $container;
    
    /** @var \Slim\Slim */
    protected $app;
    
    /**
     * Set up Router 
     * @param arary $container
     */
    public function __construct($container)
    {
        $this->container = $container;
        $this->app = $container['app'];
    }
    
    //define all of the routes 
    public function route() {
        $container = $this->container;
        
        $this->app->get('/', function () use($container) {
            echo $container['twig']->render('layout.html.twig');
        });
        
        $this->app->get('/category', function() use($container) {
        
            $controller = new \AuctionManager\controller\Category($container);
            echo $controller->listAction();
        });
        $this->app->get('/item', function() use($container) {
        
            $controller = new \AuctionManager\controller\Item($container);
            echo $controller->listAction();
        });
    }
}

?>