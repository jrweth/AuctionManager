<?php 

namespace AuctionManager\controller;

abstract class Base
{
    /**  @var array */
    protected $container;
    
    /**  @var \PDO */
    protected $db;
    
    /** @var \Twig_Environment **/
    protected $twig;
    
    /**
     * 
     * @param array $request
     * @param \SQLite3 $db
     * @param \Twig_Environment $twig
     */
    public function __construct($container)
    {
        $this->db = $container['db'];
        $this->twig = $container['twig'];
        $this->app = $container['app'];
        $this->container = $container;
    }
    
}
