<?php
$filename = isset($_GET['fn']) ? $_GET['fn'] : null;
$respone = "{ \"State\": \"FileNotFound\" }";

if($filename != null)
{

$safeFilename = basename($filename);
$filepath = __DIR__ ."/JSON/". $safeFilename;

$response = file_get_contents($filepath);
}

header('Content-type: application/json');
echo $response;

?>