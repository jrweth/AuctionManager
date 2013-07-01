<?php 

$dataTypeColumns = array('id', 'name');
            

switch ($_REQUEST['action']) {
    
    case 'list':
    default:
        $sql = 'select ' .implode(', ' , $dataTypeColumns) .' from Category order by name';
        
        $result1 = $db->query($sql);
        if(!$result1) {
            $redtextmsg =  "query1 of $thiscategory table failed";
            print 'err';
        } else {
        
            $data = array();
            while($res = $result1->fetchArray(SQLITE3_ASSOC)){
                $data[] = $res;
            }
        } 
        echo $twig->render('category/list.html.twig', array('data' => $data));
}