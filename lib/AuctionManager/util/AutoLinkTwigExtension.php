<?php
namespace AuctionManager\util;

class AutoLinkTwigExtension extends \Twig_Extension
{

    public function getFilters()
    {
        return array('auto_link_text' => new \Twig_Filter_Method($this, 'auto_link_text', array('is_safe' => array('html'))),
        );
    }

    public function getName()
    {
        return "auto_link_twig_extension";
    }

    static public function auto_link_text($string)
    {
        $regexp = "/(http|https|ftp|ftps)\:\/\/[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,5}(\/\S*)?/";
        
        preg_match_all($regexp, $string, $matches, \PREG_PATTERN_ORDER);

        foreach ($matches[0] as $match) {
            $replace = '<a href="' . $match . '" target="_blank\" >' . $match . '</a>';
            $string = str_replace($match, $replace, $string);
        }

        return $string;
    }
}