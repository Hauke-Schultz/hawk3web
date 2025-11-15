<?php
/**
 * RSVP API für Party-Einladungen
 * Verwendet JSON-Datei als Speicher
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://haukeschultz.com');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// OPTIONS Request für CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Konfiguration
define('RSVP_FILE', __DIR__ . '/rsvp.json');
define('ADMIN_EMAIL', 'all@haukeschultz.com'); // Admin E-Mail für Benachrichtigungen

/**
 * RSVPs aus JSON-Datei laden
 */
function loadRSVPs() {
    if (!file_exists(RSVP_FILE)) {
        // Erstelle leere Datei wenn nicht vorhanden
        saveRSVPs([]);
        return [];
    }

    $json = file_get_contents(RSVP_FILE);
    $data = json_decode($json, true);

    if ($data === null) {
        error_log('Failed to decode rsvp.json');
        return [];
    }

    return $data;
}

/**
 * RSVPs in JSON-Datei speichern
 */
function saveRSVPs($rsvps) {
    $json = json_encode($rsvps, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

    if ($json === false) {
        error_log('Failed to encode RSVPs');
        return false;
    }

    $result = file_put_contents(RSVP_FILE, $json, LOCK_EX);

    if ($result === false) {
        error_log('Failed to write rsvp.json');
        return false;
    }

    return true;
}

/**
 * Validierung der RSVP-Daten
 */
function validateRSVPData($data) {
    $errors = [];

    if (!isset($data['guestId']) || empty(trim($data['guestId']))) {
        $errors[] = 'guestId is required';
    }

    if (!isset($data['name']) || empty(trim($data['name']))) {
        $errors[] = 'name is required';
    }

    if (isset($data['name']) && mb_strlen($data['name']) > 50) {
        $errors[] = 'name too long (max 50 characters)';
    }

    if (!isset($data['status']) || !in_array($data['status'], ['pending', 'accepted', 'declined'])) {
        $errors[] = 'status must be one of: pending, accepted, declined';
    }

    if (isset($data['numberOfGuests']) && (!is_numeric($data['numberOfGuests']) || $data['numberOfGuests'] < 1 || $data['numberOfGuests'] > 10)) {
        $errors[] = 'numberOfGuests must be a number between 1 and 10';
    }

    return $errors;
}

/**
 * Finde RSVP nach guestId
 */
function findRSVPByGuestId($rsvps, $guestId) {
    foreach ($rsvps as $index => $rsvp) {
        if ($rsvp['guestId'] === $guestId) {
            return ['index' => $index, 'data' => $rsvp];
        }
    }
    return null;
}

/**
 * Sende E-Mail-Benachrichtigung bei RSVP-Änderungen
 */
function sendRSVPNotification($rsvpData, $isNew) {
    $to = ADMIN_EMAIL;
    $subject = $isNew ? '🎉 Neuer Party Eintrag: ' . $rsvpData['name'] : '✏️ Party Eintrag aktualisiert: ' . $rsvpData['name'];

    // Status-Text
    $statusText = [
        'accepted' => '✅ Zugesagt',
        'declined' => '❌ Abgesagt',
        'pending' => '⏳ Ausstehend'
    ];
    $status = $statusText[$rsvpData['status']] ?? $rsvpData['status'];

    // Essensvorlieben formatieren
    $foodPrefsText = '';
    if (is_array($rsvpData['foodPreferences']) && count(array_filter($rsvpData['foodPreferences'])) > 0) {
        $foodLabels = [
            'standard' => 'Ich esse alles',
            'vegetarisch' => 'Vegetarisch',
            'vegan' => 'Vegan',
            'allergien' => 'Allergien/Unverträglichkeiten'
        ];
        $prefs = array_map(function($pref) use ($foodLabels) {
            return $foodLabels[$pref] ?? $pref;
        }, array_filter($rsvpData['foodPreferences']));
        $foodPrefsText = implode(', ', $prefs);
    }

    // HTML E-Mail erstellen
    $message = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
            .header { background: linear-gradient(135deg, #1e3a8a 0%, #312e81 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 20px; border-radius: 0 0 8px 8px; }
            .field { margin: 15px 0; padding: 10px; background: #f5f5f5; border-left: 4px solid #1e3a8a; }
            .field-label { font-weight: bold; color: #1e3a8a; }
            .field-value { margin-top: 5px; }
            .status-badge { display: inline-block; padding: 5px 15px; border-radius: 5px; font-weight: bold; }
            .status-accepted { background: #10b981; color: white; }
            .status-declined { background: #ef4444; color: white; }
            .status-pending { background: #f59e0b; color: white; }
            .footer { margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 5px; text-align: center; }
            .btn { display: inline-block; padding: 12px 24px; background: #1e3a8a; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h2 style='margin: 0;'>" . ($isNew ? '🎉 Neuer Party Eintrag eingegangen!' : '✏️ Party Eintrag wurde aktualisiert') . "</h2>
            </div>
            <div class='content'>
                <div class='field'>
                    <div class='field-label'>👤 Name:</div>
                    <div class='field-value'>" . htmlspecialchars($rsvpData['name']) . "</div>
                </div>

                <div class='field'>
                    <div class='field-label'>📊 Status:</div>
                    <div class='field-value'>
                        <span class='status-badge status-" . $rsvpData['status'] . "'>" . $status . "</span>
                    </div>
                </div>

                <div class='field'>
                    <div class='field-label'>👥 Anzahl Personen:</div>
                    <div class='field-value'>" . $rsvpData['numberOfGuests'] . "</div>
                </div>

                <div class='field'>
                    <div class='field-label'>🚗 Mit Auto:</div>
                    <div class='field-value'>" . ($rsvpData['comingByCar'] ? 'Ja' : 'Nein') . "</div>
                </div>

                <div class='field'>
                    <div class='field-label'>🅿️ Parkplatz benötigt:</div>
                    <div class='field-value'>" . ($rsvpData['needsParking'] ? 'Ja' : 'Nein') . "</div>
                </div>

                <div class='field'>
                    <div class='field-label'>🏨 Hotelzimmer benötigt:</div>
                    <div class='field-value'>" . ($rsvpData['needsHotelRoom'] ? 'Ja (' . $rsvpData['numberOfRooms'] . ' Zimmer)' : 'Nein') . "</div>
                </div>

                " . ($foodPrefsText ? "
                <div class='field'>
                    <div class='field-label'>🍽️ Essensvorlieben:</div>
                    <div class='field-value'>" . htmlspecialchars($foodPrefsText) . "</div>
                </div>
                " : "") . "

                " . ($rsvpData['remarks'] ? "
                <div class='field'>
                    <div class='field-label'>💬 Bemerkungen:</div>
                    <div class='field-value'>" . nl2br(htmlspecialchars($rsvpData['remarks'])) . "</div>
                </div>
                " : "") . "
            </div>
        </div>
    </body>
    </html>
    ";

    // E-Mail Headers
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= "From: Party Einladung <all@haukeschultz.com>" . "\r\n";

    // E-Mail senden
    $result = mail($to, $subject, $message, $headers);

    if (!$result) {
        error_log('Failed to send RSVP notification email to ' . $to);
    }

    return $result;
}

// Routing basierend auf REQUEST_METHOD
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // GET /api/rsvp - Lade alle RSVPs (für Admin)
        // GET /api/rsvp?guestId=xxx - Lade RSVP für einen Gast
        try {
            $rsvps = loadRSVPs();

            // Wenn kein guestId Parameter, gib alle RSVPs zurück
            if (!isset($_GET['guestId']) || empty(trim($_GET['guestId']))) {
                http_response_code(200);
                echo json_encode($rsvps);
                exit();
            }

            // Einzelnes RSVP nach guestId suchen
            $guestId = trim($_GET['guestId']);
            $result = findRSVPByGuestId($rsvps, $guestId);

            if ($result === null) {
                // Kein RSVP gefunden - das ist ok, gibt leeres Objekt zurück
                http_response_code(200);
                echo json_encode([]);
                exit();
            }

            http_response_code(200);
            echo json_encode($result['data']);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to load RSVP']);
            error_log('Error loading RSVP: ' . $e->getMessage());
        }
        break;

    case 'POST':
        // POST /api/rsvp - Speichere/Update RSVP
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
            $errors = validateRSVPData($data);
            if (!empty($errors)) {
                http_response_code(400);
                echo json_encode(['error' => 'Validation failed', 'details' => $errors]);
                exit();
            }

            // Daten bereinigen und strukturieren
            $guestId = trim($data['guestId']);
            $name = trim($data['name']);
            $status = $data['status'];
            $numberOfGuests = isset($data['numberOfGuests']) ? (int)$data['numberOfGuests'] : 1;
            $comingByCar = isset($data['comingByCar']) ? (bool)$data['comingByCar'] : false;
            $needsParking = isset($data['needsParking']) ? (bool)$data['needsParking'] : false;
            $needsHotelRoom = isset($data['needsHotelRoom']) ? (bool)$data['needsHotelRoom'] : false;
            $numberOfRooms = isset($data['numberOfRooms']) ? (int)$data['numberOfRooms'] : 1;

            // Support for foodPreferences array (new) and foodPreference string (old)
            $foodPreferences = [];
            if (isset($data['foodPreferences']) && is_array($data['foodPreferences'])) {
                $foodPreferences = $data['foodPreferences'];
            } elseif (isset($data['foodPreference']) && !empty(trim($data['foodPreference']))) {
                // Backwards compatibility: convert old foodPreference to array
                $foodPreferences = [trim($data['foodPreference'])];
            }

            $remarks = isset($data['remarks']) ? trim($data['remarks']) : '';
            $lastUpdated = isset($data['lastUpdated']) ? $data['lastUpdated'] : date('c');

            // Lade aktuelle RSVPs
            $rsvps = loadRSVPs();

            // Prüfe ob RSVP für diesen Gast bereits existiert
            $existing = findRSVPByGuestId($rsvps, $guestId);

            $rsvpData = [
                'guestId' => $guestId,
                'name' => $name,
                'status' => $status,
                'numberOfGuests' => $numberOfGuests,
                'comingByCar' => $comingByCar,
                'needsParking' => $needsParking,
                'needsHotelRoom' => $needsHotelRoom,
                'numberOfRooms' => $numberOfRooms,
                'foodPreferences' => $foodPreferences,
                'remarks' => $remarks,
                'lastUpdated' => $lastUpdated
            ];

            if ($existing !== null) {
                // Update existierendes RSVP
                $rsvps[$existing['index']] = $rsvpData;
            } else {
                // Neues RSVP hinzufügen
                $rsvps[] = $rsvpData;
            }

            // Speichern
            if (!saveRSVPs($rsvps)) {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to save RSVP']);
                exit();
            }

            // E-Mail-Benachrichtigung senden
            $isNewRSVP = ($existing === null);
            sendRSVPNotification($rsvpData, $isNewRSVP);

            http_response_code(200);
            echo json_encode([
                'message' => 'RSVP saved successfully',
                'data' => $rsvpData
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to save RSVP']);
            error_log('Error saving RSVP: ' . $e->getMessage());
        }
        break;

    case 'DELETE':
        // DELETE /api/rsvp?guestId=xxx - Lösche RSVP
        try {
            // Prüfe ob guestId Parameter vorhanden ist
            if (!isset($_GET['guestId']) || empty(trim($_GET['guestId']))) {
                http_response_code(400);
                echo json_encode(['error' => 'guestId parameter is required']);
                exit();
            }

            $guestId = trim($_GET['guestId']);

            // Lade aktuelle RSVPs
            $rsvps = loadRSVPs();

            // Finde RSVP
            $existing = findRSVPByGuestId($rsvps, $guestId);

            if ($existing === null) {
                http_response_code(404);
                echo json_encode(['error' => 'RSVP not found']);
                exit();
            }

            // Entferne RSVP aus Array
            array_splice($rsvps, $existing['index'], 1);

            // Speichern
            if (!saveRSVPs($rsvps)) {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to delete RSVP']);
                exit();
            }

            http_response_code(200);
            echo json_encode([
                'message' => 'RSVP deleted successfully',
                'guestId' => $guestId
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete RSVP']);
            error_log('Error deleting RSVP: ' . $e->getMessage());
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
?>