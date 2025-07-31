<?php 
/**
 * PHP script to pull events from PostgreSQL database 
 * and display them in Sam Hébert's website format
 */

// Database configuration - use your actual DATABASE_URL
$db_url = parse_url(getenv('DATABASE_URL'));
$host = $db_url['host'];
$port = $db_url['port'];
$dbname = ltrim($db_url['path'], '/');
$username = $db_url['user'];
$password = $db_url['pass'];

// French month names for Quebec format
$mois_francais = [
    1 => 'janvier', 2 => 'février', 3 => 'mars', 4 => 'avril',
    5 => 'mai', 6 => 'juin', 7 => 'juillet', 8 => 'août',
    9 => 'septembre', 10 => 'octobre', 11 => 'novembre', 12 => 'décembre'
];

// Days of week in French
$jours_francais = [
    0 => 'Dimanche', 1 => 'Lundi', 2 => 'Mardi', 3 => 'Mercredi',
    4 => 'Jeudi', 5 => 'Vendredi', 6 => 'Samedi'
];

/**
 * Format date in Quebec French style
 */
function formatDateQuebecois($datetime, $mois_francais, $jours_francais) {
    $timestamp = strtotime($datetime);
    $day_of_week = date('w', $timestamp); // 0 = Sunday
    $day = date('j', $timestamp);
    $month = intval(date('n', $timestamp));
    $year = date('Y', $timestamp);
    $hour = date('H', $timestamp);
    $minute = date('i', $timestamp);
    
    return sprintf("%s %d %s %d à %02dh%02d", 
                   $jours_francais[$day_of_week], 
                   $day, 
                   $mois_francais[$month], 
                   $year, 
                   $hour, 
                   $minute);
}

/**
 * Get events data from database
 */
function getEvents($host, $port, $dbname, $username, $password) {
    try {
        $pdo = new PDO("pgsql:host=$host;port=$port;dbname=$dbname", $username, $password);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        $sql = "SELECT id, title, date, venue, description, status 
                FROM events 
                WHERE status = 'published' 
                AND date >= CURRENT_TIMESTAMP
                ORDER BY date ASC";
                
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
        
    } catch (PDOException $e) {
        error_log("Database error: " . $e->getMessage());
        return false;
    }
}

// Fetch events
$events = getEvents($host, $port, $dbname, $username, $password);

// Handle API request (JSON format)
if (isset($_GET['format']) && $_GET['format'] === 'json') {
    header('Content-Type: application/json; charset=utf-8');
    
    if ($events === false) {
        echo json_encode(['erreur' => 'Erreur de base de données']);
        exit;
    }
    
    $json_events = [];
    foreach ($events as $event) {
        $json_events[] = [
            'titre' => $event['title'],
            'date' => $event['date'],
            'lieu' => $event['venue'],
            'description' => $event['description'],
            'date_formatee' => formatDateQuebecois($event['date'], $mois_francais, $jours_francais)
        ];
    }
    
    echo json_encode(['spectacles' => $json_events], JSON_UNESCAPED_UNICODE);
    exit;
}

// HTML output for website
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sam Hébert - Prochains Spectacles</title>
    <style>
        .dates-section {
            font-family: 'Arial', sans-serif;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #F5F5DC 0%, #FAEBD7 100%);
        }
        
        .dates-title {
            font-size: 2.8em;
            color: #8B4513;
            text-align: center;
            margin-bottom: 40px;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(139, 69, 19, 0.3);
            border-bottom: 3px solid #D2691E;
            padding-bottom: 15px;
        }
        
        .event-item {
            background: white;
            border-left: 6px solid #D2691E;
            margin: 20px 0;
            padding: 25px;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            transition: transform 0.2s ease;
        }
        
        .event-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(0,0,0,0.15);
        }
        
        .event-date {
            font-weight: bold;
            color: #8B4513;
            font-size: 1.3em;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
        }
        
        .event-date::before {
            content: "🎭";
            margin-right: 10px;
        }
        
        .event-title {
            display: block;
            font-weight: bold;
            color: #654321;
            font-size: 1.2em;
            margin-bottom: 8px;
        }
        
        .event-venue {
            display: block;
            color: #8B4513;
            margin-bottom: 10px;
            font-size: 1.1em;
        }
        
        .event-venue::before {
            content: "📍 ";
        }
        
        .event-description {
            display: block;
            color: #654321;
            font-style: italic;
            line-height: 1.4;
        }
        
        .no-events {
            text-align: center;
            padding: 60px 20px;
            color: #8B4513;
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .no-events h3 {
            font-size: 1.8em;
            margin-bottom: 20px;
        }
        
        .no-events p {
            font-size: 1.1em;
            margin-bottom: 15px;
        }
        
        .social-link {
            color: #D2691E;
            text-decoration: none;
            font-weight: bold;
        }
        
        .social-link:hover {
            text-decoration: underline;
        }
        
        .error-message {
            background: #ffebee;
            color: #c62828;
            padding: 20px;
            border-radius: 5px;
            border-left: 4px solid #c62828;
            margin: 20px 0;
        }
        
        @media (max-width: 768px) {
            .dates-section {
                padding: 10px;
            }
            
            .dates-title {
                font-size: 2.2em;
            }
            
            .event-item {
                padding: 20px 15px;
            }
        }
    </style>
</head>
<body>
    <div class="dates-section">
        <h1 class="dates-title">PROCHAINS SPECTACLES</h1>
        
        <?php if ($events === false): ?>
            <div class="error-message">
                <h3>Problème technique temporaire</h3>
                <p>Les dates de spectacles ne peuvent pas être affichées pour le moment.</p>
                <p>Consultez ma page <a href="https://facebook.com/samheberthumoriste" class="social-link">Facebook @samheberthumoriste</a> pour les dernières informations!</p>
            </div>
            
        <?php elseif (empty($events)): ?>
            <div class="no-events">
                <h3>Aucun spectacle programmé pour le moment</h3>
                <p>De nouvelles dates seront bientôt annoncées!</p>
                <p>Suivez-moi pour être les premiers informés :</p>
                <p>
                    <a href="https://facebook.com/samheberthumoriste" class="social-link">Facebook @samheberthumoriste</a><br>
                    <a href="https://tiktok.com/@samheberthumoriste" class="social-link">TikTok @samheberthumoriste</a>
                </p>
                <p><em>Le cowboy de l'humour revient bientôt en selle! 🤠</em></p>
            </div>
            
        <?php else: ?>
            <?php foreach ($events as $event): ?>
                <div class="event-item">
                    <div class="event-date">
                        <?= formatDateQuebecois($event['date'], $mois_francais, $jours_francais) ?>
                    </div>
                    <span class="event-title">
                        <?= htmlspecialchars($event['title'], ENT_QUOTES, 'UTF-8') ?>
                    </span>
                    <span class="event-venue">
                        <?= htmlspecialchars($event['venue'], ENT_QUOTES, 'UTF-8') ?>
                    </span>
                    <?php if (!empty($event['description'])): ?>
                        <span class="event-description">
                            <?= htmlspecialchars($event['description'], ENT_QUOTES, 'UTF-8') ?>
                        </span>
                    <?php endif; ?>
                </div>
            <?php endforeach; ?>
        <?php endif; ?>
        
        <div style="text-align: center; margin-top: 40px; color: #8B4513; font-style: italic;">
            <p>Pour réservations et informations : <a href="https://phaneuf.ca/artistes/sam-hebert/" class="social-link">Groupe Phaneuf</a></p>
        </div>
    </div>
</body>
</html>