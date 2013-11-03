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
        

        $this->app->get('/register', $authenticate($app), function() use($container) {
            echo $container['twig']->render('register.html.twig');
        });
       
        $this->app->get('/checkout', $authenticate($app), function() use($container) {
            echo $container['twig']->render('checkout.html.twig', array(
                'pageTitle' => 'Checkout'
            ));
        });
        
        $this->app->get('/featuredItems/:auction_group_id', function($auction_group_id) use ($container) {
            $sql = 'select Item.notes, Item.title, Item.donor_display_name, Item.description, Item.image_url, Item.item_order_number, category.name as category_name
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
            foreach($items as $key => $item) {
                if($item->image_url) {
                    $item->large_image_url = str_replace('/s128/','/s512/',$item->image_url);
                }
                else {$item->large_image_url = false; }
            }
            echo $container['twig']->render('allItems.html.twig', array(
                            'pageTitle' => 'All Items',
                            'items' => $items
            ));
        });
        
        //REports
        $this->app->get('/reports/paymentMismatches', $authenticate($app), function() use($container) {
            $sql = 'select contact.last_name, contact.middle_name, contact.first_name, bidder.id, bidder_number, purchase_total, payment_total
                from bidder
                join contact on bidder.contact_id = contact.id
                left join (
                    SELECT bidder_id, sum(amount) purchase_total
                    FROM "Purchase"
                    group by bidder_id) purchases on bidder.id = purchases.bidder_id
                left join (
                    SELECT bidder_id, sum(amount) payment_total
                    FROM "Payment"
                    group by bidder_id) payments on bidder.id = payments.bidder_id
                where (
                    purchase_total <> payment_total
                    or purchase_total is null and payment_total is not null
                    or purchase_total is not null and payment_total is null
                )
                    and bidder.auction_id = '. $_SESSION['auctionId'];
            $sth = $container['db']->query($sql);
            $sth->execute();
            $data = $sth->fetchAll(\PDO::FETCH_ASSOC);
            foreach($data as $key=>$row) {
                $data[$key]['amount_owed'] = floatval($row['purchase_total']) - floatval($row['payment_total']);
            }
            //exit();
            echo $container['twig']->render('report.html.twig', array(
                            'pageTitle' => 'Purchase/Payment Mismatches',
                            'data' => $data,
                            'columns' => array('last_name', 'first_name', 'middle_name', 'bidder_number', 'purchase_total', 'payment_total', 'amount_owed')
            ));
        });
        
        
        $this->app->get('/reports/noPayment', $authenticate($app), function() use($container) {
            $sql = 'select contact.last_name, contact.middle_name, contact.first_name, bidder.id, bidder_number, purchase_total, payment_total
            from bidder
            join contact on bidder.contact_id = contact.id
            left join (
                SELECT bidder_id, sum(amount) purchase_total
                FROM "Purchase"
                group by bidder_id) purchases on bidder.id = purchases.bidder_id
            left join (
                SELECT bidder_id, sum(amount) payment_total
                FROM "Payment"
                group by bidder_id) payments on bidder.id = payments.bidder_id
            where purchase_total is not null and payment_total is null
                and bidder.auction_id = '. $_SESSION['auctionId'];
            $sth = $container['db']->query($sql);
            $sth->execute();
            $data = $sth->fetchAll(\PDO::FETCH_ASSOC);
            foreach($data as $key=>$row) {
                $data[$key]['amount_owed'] = floatval($row['purchase_total']) - floatval($row['payment_total']);
            }
            //exit();
            echo $container['twig']->render('report.html.twig', array(
                            'pageTitle' => 'Bidders who haven\'t paid',
                            'data' => $data,
                            'columns' => array('last_name', 'first_name', 'middle_name', 'bidder_number', 'purchase_total', 'payment_total', 'amount_owed')
            ));
        });
        
        $this->app->get('/reports/allPayments', $authenticate($app), function() use($container) {
            $sql = "select ifnull(contact.last_name,'') || ', ' || ifnull(contact.first_name, '') || ' ' || ifnull(contact.middle_name,'') as name,
                    bidder_number, payment_type, payment.amount, payment_date,
                    ifnull(bidder_payment_total,0) bidder_payment_total,
                    ifnull(bidder_purchase_total,0) bidder_purchase_total
                from payment
                join bidder on payment.bidder_id = bidder.id
                join contact on bidder.contact_id = contact.id
                left join (
                    SELECT bidder_id, sum(amount) bidder_purchase_total
                    FROM Purchase
                    group by bidder_id) purchases on bidder.id = purchases.bidder_id
                left join (
                    SELECT bidder_id, sum(amount) bidder_payment_total
                    FROM Payment
                    group by bidder_id) payments on bidder.id = payments.bidder_id
                where bidder.auction_id = ". $_SESSION['auctionId'];
            $sth = $container['db']->query($sql);
            $sth->execute();
            $data = $sth->fetchAll(\PDO::FETCH_ASSOC);
            echo $container['twig']->render('reportAllPayments.html.twig', array(
                            'pageTitle' => 'All Payments',
                            'data' => $data,
                            'columns' => array('name', 'bidder_number', 'payment_type', 'amount', 'payment_date', 'bidder_payment_total', 'bidder_purchase_total')
            ));
        });
        
        
        $this->app->get('/reports/specialItemTotals', $authenticate($app), function() use($container) {
            $sql = "select item.title, sum(amount) total_amount, count(purchase.id) number_purchased
                from purchase
                join item on purchase.item_id = item.id
                left join auction_block on item.auction_block_id = auction_block.id
                where (auction_block.id is null or auction_block.name != 'Live Auction')
                and item.auction_id = ". $_SESSION['auctionId'] . '
                group by item_id, item.title';
            
            $sth = $container['db']->query($sql);
            $sth->execute();
            $data = $sth->fetchAll(\PDO::FETCH_ASSOC);
            echo $container['twig']->render('report.html.twig', array(
                            'pageTitle' => 'Special Item Totals',
                            'data' => $data,
                            'columns' => array('title', 'total_amount', 'number_purcahsed')
            ));
        });
        
        $this->app->get('/reports/itemDonorReport', $authenticate($app), function() use($container) {
            $sql = "
                select item.item_order_number, item.title, contact.first_name, contact.middle_name, contact.last_name, item.donor_committee_contact, sum(purchase.amount) amount_rasied
                from item
                left join item_contact on item.id = item_contact.item_id
                left join contact on item_contact.contact_id = contact.id
                left join purchase on item.id = purchase.item_id
                where item.auction_id = ". $_SESSION['auctionId'] . '
                group by item.item_order_number, item.title, contact.first_name, contact.middle_name, contact.last_name, item.donor_committee_contact';
        
            $sth = $container['db']->query($sql);
            $sth->execute();
            $data = $sth->fetchAll(\PDO::FETCH_ASSOC);
            echo $container['twig']->render('report.html.twig', array(
                            'pageTitle' => 'Item Donor Report',
                            'data' => $data,
                            'columns' => array('item_order_number', 'title', 'first_name', 'middle_name', 'last_name', 'donor_committee_contact', 'amount_raised')
            ));
        });
        
        $this->app->get('/statusUpdate/:auction_group_id', function($auction_group_id) use ($container) {
            
            //get the last purchase from the live auction
            $sql = 'select max(purchase.id)
            from purchase
            join item on purchase.item_id = item.id
            join auction on item.auction_id = auction.id
            join auction_block on item.auction_block_id = auction_block.id
            where auction_block.name = \'Live Auction\'
            and item.item_order_number is not null
            and auction.is_default_auction = 1
            and auction.auction_group_id = ?';
            
            $stmt = $container['db']->query($sql);
            $stmt->execute(array(intval($auction_group_id)));
            $last_purchase_id = $stmt->fetchColumn();
            $sql = 'select * 
            from Item
            join auction_block on item.auction_block_id = auction_block.id
            where
                auction_block.name = \'Live Auction\'
                and item_order_number >= (
                    select item_order_number from item
                    join purchase on item.id = purchase.item_id
                    where purchase.id = ' . $last_purchase_id .') 
            order by item_order_number';
            
            $stmt2 = $container['db']->query($sql);
            $stmt2->execute();
            $items = $stmt2->fetchAll(\PDO::FETCH_CLASS);
            
            //get the total amount raised
            $sql = 'select sum(purchase.amount) total_amount_raised
            from purchase
            join item on purchase.item_id = item.id
            join auction on item.auction_id = auction.id
            where auction.is_default_auction = 1
            and auction.auction_group_id = ?';
          
            $stmt = $container['db']->query($sql);
            $stmt->execute(array(intval($auction_group_id)));
            $totalPurchases = $stmt->fetchColumn();
            
            echo $container['twig']->render('statusUpdate.html.twig', array(
                            'pageTitle' => 'Status Update',
                            'items' => $items,
                            'totalPurchases' => $totalPurchases
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