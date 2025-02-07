<?php
header('Content-Type: application/json');

// Get filename from GET parameter
$filename = isset($_GET['fn']) ? $_GET['fn'] : '';

// Validate filename
if (empty($filename)) {
    echo json_encode(['success' => false, 'message' => 'Filename is required']);
    exit;
}

// Add safety checks for filename
$filename = basename($filename); // Remove path components
$filename = preg_replace('/[^a-zA-Z0-9._-]/', '', $filename); // Only allow safe characters

// Specify the directory where files should be created
$directory = 'JSON/'; // Make sure this directory exists and is writable

try {
    // Create the file
    if(!str_contains($filename, ".json"))
        $filename = $filename.".json";

    $filepath = $directory . $filename;
    
    $f=fopen($filepath,'w+');
    fwrite($f,file_get_contents("./JSON/btnTemplate.json"));
    fclose($f);

    echo "{ \"success\" : 1}";
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Server error']);
}

?>