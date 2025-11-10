<?php
/**
 * Highscore API für Strato Shared Hosting
 * Verwendet JSON-Datei als Speicher
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *'); // Für Development - später auf deine Domain beschränken
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// OPTIONS Request für CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Konfiguration
define('HIGHSCORES_FILE', __DIR__ . '/highscores.json');
define('MAX_HIGHSCORES', 100); // Speichere Top 100, zeige Top 10

/**
 * Highscores aus JSON-Datei laden
 */
function loadHighscores() {
    if (!file_exists(HIGHSCORES_FILE)) {
        // Erstelle Datei mit Dummy-Daten wenn nicht vorhanden
        $dummyData = [
            ['rank' => 1, 'playerId' => 'dummy-1', 'name' => 'MaxPower', 'level' => 300, 'date' => '2025-10-20'],
            ['rank' => 2, 'playerId' => 'dummy-2', 'name' => 'LevelKing', 'level' => 200, 'date' => '2025-10-18'],
            ['rank' => 3, 'playerId' => 'dummy-3', 'name' => 'ClickMaster', 'level' => 100, 'date' => '2025-10-15'],
            ['rank' => 4, 'playerId' => 'dummy-4', 'name' => 'PartyHero', 'level' => 90, 'date' => '2025-10-12'],
            ['rank' => 5, 'playerId' => 'dummy-5', 'name' => 'ButtonSmasher', 'level' => 80, 'date' => '2025-10-10'],
            ['rank' => 6, 'playerId' => 'dummy-6', 'name' => 'ProGamer', 'level' => 70, 'date' => '2025-10-08'],
            ['rank' => 7, 'playerId' => 'dummy-7', 'name' => 'SpeedClicker', 'level' => 60, 'date' => '2025-10-05'],
            ['rank' => 8, 'playerId' => 'dummy-8', 'name' => 'ChampionX', 'level' => 50, 'date' => '2025-10-02'],
            ['rank' => 9, 'playerId' => 'dummy-9', 'name' => 'NinjaFinger', 'level' => 40, 'date' => '2025-09-28'],
            ['rank' => 10, 'playerId' => 'dummy-10', 'name' => 'ClickNinja', 'level' => 30, 'date' => '2025-09-25']
        ];
        saveHighscores($dummyData);
        return $dummyData;
    }

    $json = file_get_contents(HIGHSCORES_FILE);
    $data = json_decode($json, true);

    if ($data === null) {
        error_log('Failed to decode highscores.json');
        return [];
    }

    return $data;
}

/**
 * Highscores in JSON-Datei speichern
 */
function saveHighscores($highscores) {
    $json = json_encode($highscores, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

    if ($json === false) {
        error_log('Failed to encode highscores');
        return false;
    }

    $result = file_put_contents(HIGHSCORES_FILE, $json, LOCK_EX);

    if ($result === false) {
        error_log('Failed to write highscores.json');
        return false;
    }

    return true;
}

/**
 * Validierung der Eingabedaten
 */
function validateHighscoreData($data) {
    $errors = [];

    if (!isset($data['playerId']) || empty(trim($data['playerId']))) {
        $errors[] = 'playerId is required';
    }

    if (!isset($data['name']) || empty(trim($data['name']))) {
        $errors[] = 'name is required';
    }

    if (isset($data['name']) && mb_strlen($data['name']) > 20) {
        $errors[] = 'name too long (max 20 characters)';
    }

    if (!isset($data['level']) || !is_numeric($data['level'])) {
        $errors[] = 'level must be a number';
    }

    if (isset($data['level']) && $data['level'] < 0) {
        $errors[] = 'level must be positive';
    }

    return $errors;
}

// Routing basierend auf REQUEST_METHOD
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // GET /api/highscores - Lade alle Highscores
        try {
            $highscores = loadHighscores();

            // Gib alle Highscores zurück
            echo json_encode($highscores);
            http_response_code(200);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to load highscores']);
            error_log('Error loading highscores: ' . $e->getMessage());
        }
        break;

    case 'POST':
        // POST /api/highscores - Speichere neuen Highscore
        try {
            // Lese POST-Daten
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);

            if ($data === null) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid JSON']);
                exit();
            }

            // Validierung
            $errors = validateHighscoreData($data);
            if (!empty($errors)) {
                http_response_code(400);
                echo json_encode(['error' => 'Validation failed', 'details' => $errors]);
                exit();
            }

            // Daten bereinigen
            $playerId = trim($data['playerId']);
            $name = trim($data['name']);
            $level = (int)$data['level'];
            $date = isset($data['date']) ? $data['date'] : date('Y-m-d');

            // Lade aktuelle Highscores
            $highscores = loadHighscores();

            // Prüfe ob Spieler bereits existiert
            $existingIndex = -1;
            foreach ($highscores as $index => $score) {
                if ($score['playerId'] === $playerId) {
                    $existingIndex = $index;
                    break;
                }
            }

            if ($existingIndex !== -1) {
                // Spieler existiert - nur updaten wenn neuer Score besser ist
                if ($level > $highscores[$existingIndex]['level']) {
                    $highscores[$existingIndex] = [
                        'playerId' => $playerId,
                        'name' => $name,
                        'level' => $level,
                        'date' => $date
                    ];
                } else {
                    // Bestehender Score ist besser
                    $rank = $existingIndex + 1;

                    http_response_code(200);
                    echo json_encode([
                        'message' => 'Existing score is better',
                        'rank' => $rank,
                        'highscores' => $highscores
                    ]);
                    exit();
                }
            } else {
                // Neuer Spieler - hinzufügen
                $highscores[] = [
                    'playerId' => $playerId,
                    'name' => $name,
                    'level' => $level,
                    'date' => $date
                ];
            }

            // Sortieren nach Level (höchste zuerst)
            usort($highscores, function($a, $b) {
                return $b['level'] - $a['level'];
            });

            // Nur Top 100 behalten
            $highscores = array_slice($highscores, 0, MAX_HIGHSCORES);

            // Ranks neu zuweisen
            foreach ($highscores as $index => &$score) {
                $score['rank'] = $index + 1;
            }
            unset($score); // Referenz freigeben

            // Speichern
            if (!saveHighscores($highscores)) {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to save highscore']);
                exit();
            }

            // Finde Rang des Spielers
            $playerRank = 0;
            foreach ($highscores as $index => $score) {
                if ($score['playerId'] === $playerId) {
                    $playerRank = $index + 1;
                    break;
                }
            }

            // Gib alle Highscores zurück
            http_response_code(200);
            echo json_encode([
                'message' => 'Highscore saved successfully',
                'rank' => $playerRank,
                'highscores' => $highscores
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to save highscore']);
            error_log('Error saving highscore: ' . $e->getMessage());
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
?>