<?php
/**
 * Sprite-Sheets API für PHP Hosting
 * Verwaltet PNG-Dateien im dungeon/items Ordner
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://haukeschultz.com');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// OPTIONS Request für CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Konfiguration
define('SPRITE_SHEETS_DIR', __DIR__ . '/../public/dungeon/items');

/**
 * Erstelle Verzeichnis wenn es nicht existiert
 */
function ensureDirectoryExists($dir) {
    if (!file_exists($dir)) {
        mkdir($dir, 0755, true);
    }
}

/**
 * GET - Alle verfügbaren Sprite-Sheets auflisten
 */
function getAvailableSpriteSheets() {
    ensureDirectoryExists(SPRITE_SHEETS_DIR);

    $files = scandir(SPRITE_SHEETS_DIR);
    $spriteSheets = [];

    foreach ($files as $file) {
        // Nur PNG-Dateien
        if (pathinfo($file, PATHINFO_EXTENSION) === 'png') {
            $fileName = pathinfo($file, PATHINFO_FILENAME);
            $spriteSheets[] = [
                'name' => $fileName,
                'path' => '/dungeon/items/' . $file,
                'gridSize' => 16
            ];
        }
    }

    return $spriteSheets;
}

/**
 * POST - Sprite-Sheet speichern
 */
function saveSpriteSheet() {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!isset($data['imageData']) || !isset($data['fileName'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields: imageData, fileName']);
        return;
    }

    $imageData = $data['imageData'];
    $fileName = $data['fileName'];

    // Validierung
    if (!preg_match('/\.png$/', $fileName)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid filename. Must be a .png file.']);
        return;
    }

    // Sicherheit: Keine Pfad-Traversierung erlauben
    if (strpos($fileName, '/') !== false || strpos($fileName, '\\') !== false) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid filename. Path separators not allowed.']);
        return;
    }

    // Base64 Prefix entfernen
    $imageData = preg_replace('/^data:image\/png;base64,/', '', $imageData);

    // Base64 zu Binary konvertieren
    $imageBuffer = base64_decode($imageData);

    if ($imageBuffer === false) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid base64 image data']);
        return;
    }

    // Verzeichnis sicherstellen
    ensureDirectoryExists(SPRITE_SHEETS_DIR);

    // Datei speichern
    $filePath = SPRITE_SHEETS_DIR . '/' . $fileName;
    $result = file_put_contents($filePath, $imageBuffer);

    if ($result === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save sprite sheet']);
        return;
    }

    echo json_encode([
        'message' => 'Sprite sheet saved successfully',
        'fileName' => $fileName,
        'path' => '/dungeon/items/' . $fileName
    ]);
}

// Router
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $spriteSheets = getAvailableSpriteSheets();
        echo json_encode($spriteSheets);
        break;

    case 'POST':
        saveSpriteSheet();
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
?>
