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
        $this->app->container = $this->container;
        $app = $this->app;
        $container = $this->container;
        $twig = $container['twig'];
        
        $authenticate = function ($app) {
            return function () use ($app) {
                if (!isset($_SESSION['user'])) {
                    $_SESSION['urlRedirect'] = $app->request()->getPathInfo();
                    $app->flash('error', 'Login required');
                    $app->redirect($app->container['config']['webRoot'].'login');
                }
            };
        };
        
        $this->app->hook('slim.before.dispatch', function() use ($app) {
            $user = null;
            if (isset($_SESSION['user'])) {
                $user = $_SESSION['user'];
                $app->container['twig']->addGlobal('user', $user);
                $app->container['twig']->addGlobal('auctionId', $_SESSION['auctionId']);
                $app->container['twig']->addGlobal('auctionGroupId', $_SESSION['auctionGroupId']);
            }
        });
        $this->app->expires('-1 day');
        
        $this->app->get('/', function () use($container) {
            echo $container['twig']->render('layout.html.twig');
        });
        
        $this->app->get('/modelDefs.js', $authenticate($app), function() use($container, $app) {
            $app->response()->headers()->offsetSet('Content-Type','application/javascript');
            echo $container['twig']->render('modelDefs.js.twig');
        });
        
        $this->app->get('/entry/:model', $authenticate($app), function() use($container) {
            echo $container['twig']->render('entry.html.twig', array('pageTitle' => 'Contact List'));
        });
        

        $this->app->get('/register', function() use($container) {
            echo $container['twig']->render('register.html.twig');
        });
       
        $this->app->get('/checkout', $authenticate($app), function() use($container) {
            echo $container['twig']->render('checkout.html.twig', array(
                'pageTitle' => 'Checkout'
            ));
        });
        
        $this->app->get('/featuredItems/:auction_group_id', function($auction_group_id) use ($container) {
            $sql = 'select Item.title, Item.donor_display_name, Item.description, Item.image_url, Item.item_order_number, category.name as category_name
                from Item join auction on item.auction_id = auction.id
                left join category on item.category_id = category.id
                where auction.is_default_auction = 1
                and Item.featured_item = \'yes\'
                and Item.public_display_item = \'yes\'
                and auction.auction_group_id = ?';
            $sth = $container['db']->query($sql);
            $sth->execute(array(intval($auction_group_id)));
            $items = $sth->fetchAll(\PDO::FETCH_CLASS);
            echo $container['twig']->render('featuredItems.html.twig', array(
                'pageTitle' => 'Featured Items',
                'items' => $items
            ));
        });
        
        
        $this->app->get('/allItems/:auction_group_id', function($auction_group_id) use ($container) {
            $sql = 'select Item.title, Item.donor_display_name, Item.description, Item.image_url, Item.item_order_number, category.name as category_name
            from Item join auction on item.auction_id = auction.id
            left join category on item.category_id = category.id
            where auction.is_default_auction = 1
            and Item.public_display_item = \'yes\'
            and auction.auction_group_id = ?';
            $sth = $container['db']->query($sql);
            $sth->execute(array(intval($auction_group_id)));
            $items = $sth->fetchAll(\PDO::FETCH_CLASS);
            echo $container['twig']->render('allItems.html.twig', array(
                            'pageTitle' => 'All Items',
                            'items' => $items
            ));
        });
        
        $app->get("/logout", function () use ($app) {
           unset($_SESSION['user']);
            $app->redirect($app->container['config']['webRoot']);
        });
        
        $app->get("/login", function () use ($app) {
           $flash = $app->view()->getData('flash');
        
           $error = '';
           if (isset($flash['error'])) {
              $error = $flash['error'];
           }
        
           $urlRedirect = '/';
           
           if ($app->request()->get('r') && $app->request()->get('r') != '/logout' && $app->request()->get('r') != '/login') {
              $_SESSION['urlRedirect'] = $app->request()->get('r');
           }
        
           if (isset($_SESSION['urlRedirect'])) {
              $urlRedirect = $_SESSION['urlRedirect'];
           }
        
           $username = $login_error = '';
        
           if (isset($flash['username'])) {
              $username = $flash['username'];
           }
           
           echo $app->container['twig']->render('login.html.twig', array(
               'pageTitle' => 'Login',
               'error' => $error,
               'username' => $username,
               'login_error' => $login_error,
               'urlRedirect' => $urlRedirect
           ));
        });
        
        $app->post("/login", function () use ($app) {
            $username = $app->request()->post('username');
            $password = md5($app->request()->post('password'));

            $stmt = $app->container['db']->query('select id, name from auction_group where username = ? and password = ?');
            $params = array($username, $password);
            $stmt->execute($params);
            
            $records = $stmt->fetchAll(\PDO::FETCH_CLASS);
            if(array_key_exists(0, $records)) {
                //set session options
                $_SESSION['user'] = $username;
                $_SESSION['auctionGroupId'] = $records[0]->id;
                
                //go get the default auction for this auction group
                $stmt = $app->container['db']->query('select id from auction where auction_group_id = ? and is_default_auction = 1');
                $stmt->execute(array($_SESSION['auctionGroupId']));
                $_SESSION['auctionId'] = $stmt->fetchColumn();
            }
            else {
                $error = "Username/Password invalid";
                $app->flash('error', $error);
                $app->redirect($app->container['config']['webRoot'].'login');
            }
            
            if (isset($_SESSION['urlRedirect'])) {
               $tmp = $_SESSION['urlRedirect'];
               unset($_SESSION['urlRedirect']);
               if(preg_match('/entry\/(.*)/', $tmp, $matches)) {
                   $tmp = $matches[0] . '#model/' . $matches[1];
               }
               $app->redirect($app->container['config']['webRoot'].$tmp);
            }
            
            $app->redirect($app->container['config']['webRoot']);
        });
    }
}

?>