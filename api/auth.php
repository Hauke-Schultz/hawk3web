<?php
/**
 * Authentication API für Strato Shared Hosting
 * Verwendet JSON-Datei als Speicher
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
define('USERS_FILE', __DIR__ . '/users.json');

/**
 * Passwort hashen mit SHA-256
 */
function hashPassword($password) {
    return hash('sha256', $password);
}

/**
 * Benutzer aus JSON-Datei laden
 */
function loadUsers() {
    if (!file_exists(USERS_FILE)) {
        file_put_contents(USERS_FILE, json_encode([], JSON_PRETTY_PRINT));
        return [];
    }

    $json = file_get_contents(USERS_FILE);
    $data = json_decode($json, true);

    if ($data === null) {
        error_log('Failed to decode users.json');
        return [];
    }

    return $data;
}

/**
 * Benutzer in JSON-Datei speichern
 */
function saveUsers($users) {
    $json = json_encode($users, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    if (file_put_contents(USERS_FILE, $json) === false) {
        error_log('Failed to write users.json');
        return false;
    }
    return true;
}

/**
 * Validierung: Benutzername
 */
function validateUsername($username) {
    if (empty($username)) {
        return 'Username is required';
    }
    if (strlen($username) < 3 || strlen($username) > 20) {
        return 'Username must be between 3 and 20 characters';
    }
    if (!preg_match('/^[a-zA-Z0-9_-]+$/', $username)) {
        return 'Username can only contain letters, numbers, hyphens and underscores';
    }
    return null;
}

/**
 * Validierung: Passwort
 */
function validatePassword($password) {
    if (empty($password)) {
        return 'Password is required';
    }
    if (strlen($password) < 4) {
        return 'Password must be at least 4 characters';
    }
    return null;
}

/**
 * JSON Response senden
 */
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}

/**
 * Fehler Response senden
 */
function sendError($message, $statusCode = 400) {
    sendResponse(['error' => $message], $statusCode);
}

// Request Body parsen
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if ($data === null && !empty($input)) {
    sendError('Invalid JSON', 400);
}

// Route basierend auf action parameter
$action = isset($_GET['action']) ? $_GET['action'] : (isset($data['action']) ? $data['action'] : '');

switch ($action) {
    case 'register':
        // Registrierung
        $username = isset($data['username']) ? trim($data['username']) : '';
        $password = isset($data['password']) ? $data['password'] : '';

        // Validierung
        $usernameError = validateUsername($username);
        if ($usernameError) {
            sendError($usernameError, 400);
        }

        $passwordError = validatePassword($password);
        if ($passwordError) {
            sendError($passwordError, 400);
        }

        // Benutzer laden
        $users = loadUsers();
        $usernameLower = strtolower($username);

        // Prüfen ob Benutzername bereits existiert
        if (isset($users[$usernameLower])) {
            sendError('Username already exists', 400);
        }

        // Neuen Benutzer erstellen
        $users[$usernameLower] = [
            'username' => $username,
            'password' => hashPassword($password),
            'createdAt' => date('c'),
            'lastLogin' => null
        ];

        // Speichern
        if (!saveUsers($users)) {
            sendError('Failed to create user', 500);
        }

        sendResponse([
            'success' => true,
            'message' => 'User registered successfully',
            'username' => $username
        ]);
        break;

    case 'login':
        // Login
        $username = isset($data['username']) ? trim($data['username']) : '';
        $password = isset($data['password']) ? $data['password'] : '';

        // Validierung
        if (empty($username) || empty($password)) {
            sendError('Username and password are required', 400);
        }

        // Benutzer laden
        $users = loadUsers();
        $usernameLower = strtolower($username);

        // Prüfen ob Benutzer existiert
        if (!isset($users[$usernameLower])) {
            sendError('Invalid username or password', 401);
        }

        $user = $users[$usernameLower];

        // Passwort prüfen
        if ($user['password'] !== hashPassword($password)) {
            sendError('Invalid username or password', 401);
        }

        // Last login aktualisieren
        $users[$usernameLower]['lastLogin'] = date('c');
        saveUsers($users);

        sendResponse([
            'success' => true,
            'message' => 'Login successful',
            'username' => $user['username'],
            'createdAt' => $user['createdAt'],
            'lastLogin' => $users[$usernameLower]['lastLogin']
        ]);
        break;

    default:
        sendError('Invalid action. Use action=register or action=login', 400);
}
