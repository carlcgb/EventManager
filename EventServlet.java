import java.io.*;
import java.sql.*;
import java.text.*;
import java.util.*;
import javax.servlet.*;
import javax.servlet.http.*;

/**
 * Servlet to pull events from database and display them on Sam Hébert's website
 * in the exact format of Quebec comedian date sections
 */
public class EventServlet extends HttpServlet {
    
    // Connection pool or database URL - configure with your actual values
    private static final String DB_URL = System.getenv("DATABASE_URL");
    
    // French formatting for Quebec dates
    private static final Map<Integer, String> MOIS_FRANCAIS = Map.of(
        0, "janvier", 1, "février", 2, "mars", 3, "avril",
        4, "mai", 5, "juin", 6, "juillet", 7, "août",
        8, "septembre", 9, "octobre", 10, "novembre", 11, "décembre"
    );
    
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        response.setContentType("text/html; charset=UTF-8");
        PrintWriter out = response.getWriter();
        
        try {
            String eventsHtml = generateEventsHtml();
            out.println(eventsHtml);
        } catch (Exception e) {
            out.println(generateErrorHtml());
            e.printStackTrace();
        }
    }
    
    /**
     * Generates the HTML for the dates section matching Quebec comedian websites
     */
    private String generateEventsHtml() throws SQLException {
        StringBuilder html = new StringBuilder();
        
        // CSS styling to match Quebec comedian website aesthetics
        html.append("<style>\n");
        html.append(".dates-section { font-family: 'Arial', sans-serif; max-width: 800px; margin: 0 auto; }\n");
        html.append(".dates-title { font-size: 2.5em; color: #8B4513; text-align: center; margin-bottom: 30px; font-weight: bold; }\n");
        html.append(".event-item { background: #F5F5DC; border-left: 5px solid #D2691E; margin: 15px 0; padding: 20px; border-radius: 5px; }\n");
        html.append(".event-date { font-weight: bold; color: #8B4513; font-size: 1.2em; margin-bottom: 10px; }\n");
        html.append(".event-title { display: block; font-weight: bold; color: #654321; font-size: 1.1em; margin-bottom: 5px; }\n");
        html.append(".event-venue { display: block; color: #8B4513; margin-bottom: 10px; }\n");
        html.append(".event-description { display: block; color: #654321; font-style: italic; }\n");
        html.append(".no-events { text-align: center; padding: 40px; color: #8B4513; }\n");
        html.append("</style>\n\n");
        
        html.append("<div class=\"dates-section\">\n");
        html.append("    <h1 class=\"dates-title\">PROCHAINS SPECTACLES</h1>\n");
        
        try (Connection conn = DriverManager.getConnection(DB_URL)) {
            
            String sql = """
                SELECT id, title, date, venue, description, status
                FROM events 
                WHERE status = 'published' 
                AND date >= CURRENT_TIMESTAMP
                ORDER BY date ASC
                """;
                
            PreparedStatement stmt = conn.prepareStatement(sql);
            ResultSet rs = stmt.executeQuery();
            
            boolean hasEvents = false;
            
            while (rs.next()) {
                hasEvents = true;
                
                String title = rs.getString("title");
                Timestamp eventDate = rs.getTimestamp("date");
                String venue = rs.getString("venue");
                String description = rs.getString("description");
                
                html.append("    <div class=\"event-item\">\n");
                html.append("        <div class=\"event-date\">")
                    .append(formatDateQuebecois(eventDate))
                    .append("</div>\n");
                html.append("        <span class=\"event-title\">")
                    .append(escapeHtml(title))
                    .append("</span>\n");
                html.append("        <span class=\"event-venue\">")
                    .append(escapeHtml(venue))
                    .append("</span>\n");
                
                if (description != null && !description.trim().isEmpty()) {
                    html.append("        <span class=\"event-description\">")
                        .append(escapeHtml(description))
                        .append("</span>\n");
                }
                
                html.append("    </div>\n");
            }
            
            if (!hasEvents) {
                html.append("    <div class=\"no-events\">\n");
                html.append("        <h3>Aucun spectacle programmé pour le moment</h3>\n");
                html.append("        <p>Suivez-moi sur les réseaux sociaux pour être les premiers informés des nouvelles dates!</p>\n");
                html.append("        <p><strong>Facebook:</strong> @samheberthumoriste</p>\n");
                html.append("    </div>\n");
            }
        }
        
        html.append("</div>\n");
        return html.toString();
    }
    
    /**
     * Formats timestamp to Quebec French format: "Vendredi 15 février 2025 à 20h00"
     */
    private String formatDateQuebecois(Timestamp eventDate) {
        Calendar cal = Calendar.getInstance();
        cal.setTime(eventDate);
        
        // Days of week in French
        String[] joursOfWeek = {"Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"};
        
        String dayOfWeek = joursOfWeek[cal.get(Calendar.DAY_OF_WEEK) - 1];
        int day = cal.get(Calendar.DAY_OF_MONTH);
        String month = MOIS_FRANCAIS.get(cal.get(Calendar.MONTH));
        int year = cal.get(Calendar.YEAR);
        int hour = cal.get(Calendar.HOUR_OF_DAY);
        int minute = cal.get(Calendar.MINUTE);
        
        // Format: "Vendredi 15 février 2025 à 20h00"
        return String.format("%s %d %s %d à %02dh%02d", 
                            dayOfWeek, day, month, year, hour, minute);
    }
    
    /**
     * Alternative method for JSON API endpoint
     */
    protected void doGetJson(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        response.setContentType("application/json; charset=UTF-8");
        PrintWriter out = response.getWriter();
        
        try (Connection conn = DriverManager.getConnection(DB_URL)) {
            
            StringBuilder json = new StringBuilder();
            json.append("{ \"spectacles\": [ ");
            
            String sql = """
                SELECT title, date, venue, description
                FROM events 
                WHERE status = 'published' 
                AND date >= CURRENT_TIMESTAMP
                ORDER BY date ASC
                """;
                
            PreparedStatement stmt = conn.prepareStatement(sql);
            ResultSet rs = stmt.executeQuery();
            
            boolean first = true;
            while (rs.next()) {
                if (!first) json.append(", ");
                first = false;
                
                json.append("{ ");
                json.append("\"titre\": \"").append(escapeJson(rs.getString("title"))).append("\", ");
                json.append("\"date\": \"").append(rs.getTimestamp("date").toString()).append("\", ");
                json.append("\"lieu\": \"").append(escapeJson(rs.getString("venue"))).append("\", ");
                json.append("\"description\": \"").append(escapeJson(rs.getString("description"))).append("\", ");
                json.append("\"date_formatee\": \"").append(formatDateQuebecois(rs.getTimestamp("date"))).append("\"");
                json.append(" }");
            }
            
            json.append(" ] }");
            out.println(json.toString());
            
        } catch (SQLException e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.println("{ \"erreur\": \"Erreur de base de données\" }");
        }
    }
    
    /**
     * Generates error HTML when database is unavailable
     */
    private String generateErrorHtml() {
        return """
            <div class="dates-section">
                <h1 class="dates-title">PROCHAINS SPECTACLES</h1>
                <div class="no-events">
                    <h3>Problème technique temporaire</h3>
                    <p>Les dates de spectacles ne peuvent pas être affichées pour le moment.</p>
                    <p>Consultez ma page Facebook @samheberthumoriste pour les dernières informations!</p>
                </div>
            </div>
            """;
    }
    
    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                  .replace("<", "&lt;")
                  .replace(">", "&gt;")
                  .replace("\"", "&quot;");
    }
    
    private String escapeJson(String text) {
        if (text == null) return "";
        return text.replace("\\", "\\\\")
                  .replace("\"", "\\\"")
                  .replace("\n", "\\n");
    }
}