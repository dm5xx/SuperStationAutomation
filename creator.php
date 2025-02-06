<?php
// Function to read and modify HTML content
function processHTMLFile($filename, $myjson) {
    // Validate filename to prevent directory traversal
    $safeFilename = basename($filename);
    $filepath = __DIR__ ."/". $safeFilename;

    $safejname = basename($myjson);
    $jfilepath = __DIR__ ."/JSON/". $safejname;

    echo $filepath;
    // Check if file exists and is readable
    if (!file_exists($filepath) || !is_readable($filepath)) {
        die("Error: File not found or not readable.");
    }

    // Read the HTML content
    $content = file_get_contents($filepath);

    if($filename == "buttons.html" && $myjson != null)
    {
        $jj = file_get_contents($jfilepath);
        // $content = str_replace("let buttonJson = null;", "let buttonJson =".$jj.";", $content);   
        // $content = str_replace("readConfigFile()", "readConfigServer()", $content);   
        // $content = str_replace("./jsonhandlerread.php?fn=", "./jsonhandlerread.php?fn=".$myjson, $content);   
        // $content = str_replace("saveFile = async", "saveToServer = async", $content);

        $actual_link = (empty($_SERVER['HTTPS']) ? 'http' : 'https') . "://$_SERVER[HTTP_HOST]".dirname($_SERVER['PHP_SELF'])."/jsonhandlerwrite.php";

        $replacements = [
            "let buttonJson = null;" => "let buttonJson =".$jj.";",   
            "readConfigFile()" => "readConfigServer()",   
            "./jsonhandlerread.php?fn=" => "./jsonhandlerread.php?fn=".$myjson,   
            "saveFile(" => "saveToServer(",
            "%URLPLACEHOLDER%" => $actual_link."?fn=".$myjson
        ];
    
        // Perform replacements
        foreach ($replacements as $placeholder => $replacement) {
            $content = str_replace($placeholder, $replacement, $content);
        }
    }
    // // Example replacements (you can customize these)
    // $replacements = [
    //     '{{CURRENT_YEAR}}' => date('Y'),
    //     '{{SITE_NAME}}' => 'My Dynamic Website',
    //     // Add more placeholder replacements as needed
    // ];

    // // Perform replacements
    // foreach ($replacements as $placeholder => $replacement) {
    //     $content = str_replace($placeholder, $replacement, $content);
    // }

    return $content;
}

// Handle URL parameter
$filename = isset($_GET['fn']) ? $_GET['fn'].".html" : null;
$myjson = isset($_GET['jn']) ? $_GET['jn'].".json" : null;

if ($filename) {
    // Ensure the filename has .html extension for safety
    echo $filename;
    if (pathinfo($filename, PATHINFO_EXTENSION) !== 'html') {
        die("Error: Invalid file type. Only HTML files are allowed.");
    }

    try {
        $processedContent = processHTMLFile($filename, $myjson);
        echo $processedContent;
    } catch (Exception $e) {
        echo "An error occurred: " . $e->getMessage();
    }
} else {
    echo "No filename provided. Use ?file=yourfile.html";
}
?>