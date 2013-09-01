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
        
        $this->app->get('/entry/:model', function() use($container) {
            echo $container['twig']->render('entry.html.twig', array('pageTitle' => 'Contact List'));
        });
        

        $this->app->get('/register', function() use($container) {
            echo $container['twig']->render('register.html.twig');
        });
/*        
        $app->get("/logout", function () use ($app) {
           unset($_SESSION['user']);
           $app->view()->setData('user', null);
           $app->render('logout.php');
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
        
           $email_value = $email_error = $password_error = '';
        
           if (isset($flash['email'])) {
              $email_value = $flash['email'];
           }
        
           if (isset($flash['errors']['email'])) {
              $email_error = $flash['errors']['email'];
           }
        
           if (isset($flash['errors']['password'])) {
              $password_error = $flash['errors']['password'];
           }
        
           $app->render('login.php', array('error' => $error, 'email_value' => $email_value, 'email_error' => $email_error, 'password_error' => $password_error, 'urlRedirect' => $urlRedirect));
        });
        
        $app->post("/login", function () use ($app) {
            $email = $app->request()->post('email');
            $password = $app->request()->post('password');
        
            $errors = array();
        
            if ($email != "brian@nesbot.com") {
                $errors['email'] = "Email is not found.";
            } else if ($password != "aaaa") {
                $app->flash('email', $email);
                $errors['password'] = "Password does not match.";
            }
        
            if (count($errors) > 0) {
                $app->flash('errors', $errors);
                $app->redirect('/login');
            }
        
            $_SESSION['user'] = $email;
        
            if (isset($_SESSION['urlRedirect'])) {
               $tmp = $_SESSION['urlRedirect'];
               unset($_SESSION['urlRedirect']);
               $app->redirect($tmp);
            }
        
            $app->redirect('/');
        });
    */
    }
}

?>