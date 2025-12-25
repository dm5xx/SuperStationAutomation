<?php
$filename = isset($_GET['fn']) ? $_GET['fn'] : null;
$respone = "{ \"State\": \"Save\" }";

if($filename != null)
{

$data = json_decode(file_get_contents('php://input'), true);

$safeFilename = basename($filename);
$filepath = __DIR__ ."/JSON/". $safeFilename;

$f=fopen($filepath,'w+');
fwrite($f,str_replace('\\', '', json_encode($data)));
fclose($f);

}

header('Content-type: application/json');
echo $response;


?>