<?php 

namespace AuctionManager\controller;

abstract class Base
{
    /**
     * 
     * @var \SQLite3
     */
    protected $db;
    
    
    /** @var \Twig_Environment **/
    protected $twig;
    
    /**
     * 
     * @param array $request
     * @param \SQLite3 $db
     * @param \Twig_Environment $twig
     */
    public function __construct($db, $twig)
    {
        $this->db = $db;
        $this->twig = $twig;
        
    }
    
    public abstract function handleRequest($request, $options);
    
}
