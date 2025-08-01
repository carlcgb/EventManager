import java.sql.*;
import java.text.SimpleDateFormat;
import java.util.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Java class to pull event data from PostgreSQL database 
 * and format it for Sam Hébert's website dates section
 */
public class EventDataPuller {
    
    // Database connection details - use your actual DATABASE_URL
    private static final String DB_URL = System.getenv("DATABASE_URL");
    private static final String DB_USER = System.getenv("PGUSER");
    private static final String DB_PASSWORD = System.getenv("PGPASSWORD");
    private static final String DB_NAME = System.getenv("PGUSER");
    // French month names for Quebec format
    private static final Map<Integer, String> FRENCH_MONTHS = Map.of(
        1, "janvier", 2, "février", 3, "mars", 4, "avril",
        5, "mai", 6, "juin", 7, "juillet", 8, "août",
        9, "septembre", 10, "octobre", 11, "novembre", 12, "décembre"
    );
    
    /**
     * Main method to fetch and display events
     */
    public static void main(String[] args) {
        EventDataPuller puller = new EventDataPuller();
        String formattedEvents = puller.getFormattedEventsForWebsite();
        System.out.println(formattedEvents);
    }
    
    /**
     * Fetches events from database and returns formatted HTML for website
     */
    public String getFormattedEventsForWebsite() {
        StringBuilder htmlOutput = new StringBuilder();
        
        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
            
            // SQL query to get published events, ordered by date
            String sql = """
                SELECT title, date, venue, description, status
                FROM events 
                WHERE status = 'published' 
                AND date >= CURRENT_DATE
                ORDER BY date ASC
                """;
            
            PreparedStatement stmt = conn.prepareStatement(sql);
            ResultSet rs = stmt.executeQuery();
            
            // Build the dates section HTML
            htmlOutput.append("<div class=\"dates-section\">\n");
            htmlOutput.append("    <h2>PROCHAINS SPECTACLES</h2>\n");
            htmlOutput.append("    <div class=\"events-list\">\n");
            
            boolean hasEvents = false;
            
            while (rs.next()) {
                hasEvents = true;
                String title = rs.getString("title");
                Timestamp eventDate = rs.getTimestamp("date");
                String venue = rs.getString("venue");
                String description = rs.getString("description");
                
                // Format the date in French Quebec style
                String formattedDate = formatDateForQuebec(eventDate);
                
                // Create the event HTML
                htmlOutput.append("        <div class=\"event-item\">\n");
                htmlOutput.append("            <div class=\"event-date\">")
                          .append(formattedDate)
                          .append("</div>\n");
                htmlOutput.append("            <div class=\"event-details\">\n");
                htmlOutput.append("                <span class=\"event-title\">")
                          .append(escapeHtml(title))
                          .append("</span>\n");
                htmlOutput.append("                <span class=\"event-venue\">")
                          .append(escapeHtml(venue))
                          .append("</span>\n");
                
                if (description != null && !description.trim().isEmpty()) {
                    htmlOutput.append("                <span class=\"event-description\">")
                              .append(escapeHtml(description))
                              .append("</span>\n");
                }
                
                htmlOutput.append("            </div>\n");
                htmlOutput.append("        </div>\n");
            }
            
            if (!hasEvents) {
                htmlOutput.append("        <div class=\"no-events\">\n");
                htmlOutput.append("            <p>Aucun spectacle programmé pour le moment.</p>\n");
                htmlOutput.append("            <p>Revenez bientôt pour découvrir les prochaines dates!</p>\n");
                htmlOutput.append("        </div>\n");
            }
            
            htmlOutput.append("    </div>\n");
            htmlOutput.append("</div>\n");
            
        } catch (SQLException e) {
            System.err.println("Erreur de base de données: " + e.getMessage());
            return getErrorMessage();
        }
        
        return htmlOutput.toString();
    }
    
    /**
     * Formats date in Quebec French style: "15 février 2025 - 20h00"
     */
    private String formatDateForQuebec(Timestamp eventDate) {
        Calendar cal = Calendar.getInstance();
        cal.setTime(eventDate);
        
        int day = cal.get(Calendar.DAY_OF_MONTH);
        int month = cal.get(Calendar.MONTH) + 1; // Calendar months are 0-based
        int year = cal.get(Calendar.YEAR);
        int hour = cal.get(Calendar.HOUR_OF_DAY);
        int minute = cal.get(Calendar.MINUTE);
        
        String monthName = FRENCH_MONTHS.get(month);
        
        // Format: "15 février 2025 - 20h00"
        return String.format("%d %s %d - %02dh%02d", day, monthName, year, hour, minute);
    }
    
    /**
     * Alternative method for simple text format (like Sam's current style)
     */
    public String getSimpleTextFormat() {
        StringBuilder output = new StringBuilder();
        
        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
            
            String sql = """
                SELECT title, date, venue
                FROM events 
                WHERE status = 'published' 
                AND date >= CURRENT_DATE
                ORDER BY date ASC
                """;
            
            PreparedStatement stmt = conn.prepareStatement(sql);
            ResultSet rs = stmt.executeQuery();
            
            output.append("PROCHAINS SPECTACLES\n");
            output.append("===================\n\n");
            
            while (rs.next()) {
                String title = rs.getString("title");
                Timestamp eventDate = rs.getTimestamp("date");
                String venue = rs.getString("venue");
                
                String formattedDate = formatDateForQuebec(eventDate);
                
                // Format: • 15 février 2025 - Théâtre Corona - Montréal
                output.append("• ").append(formattedDate)
                      .append(" - ").append(venue)
                      .append("\n");
            }
            
        } catch (SQLException e) {
            output.append("Erreur lors du chargement des événements.\n");
        }
        
        return output.toString();
    }
    
    /**
     * Method to get JSON format for API endpoints
     */
    public String getJsonFormat() {
        StringBuilder json = new StringBuilder();
        json.append("{\n  \"events\": [\n");
        
        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
            
            String sql = """
                SELECT title, date, venue, description
                FROM events 
                WHERE status = 'published' 
                AND date >= CURRENT_DATE
                ORDER BY date ASC
                """;
            
            PreparedStatement stmt = conn.prepareStatement(sql);
            ResultSet rs = stmt.executeQuery();
            
            boolean first = true;
            while (rs.next()) {
                if (!first) json.append(",\n");
                first = false;
                
                String title = rs.getString("title");
                Timestamp eventDate = rs.getTimestamp("date");
                String venue = rs.getString("venue");
                String description = rs.getString("description");
                
                json.append("    {\n");
                json.append("      \"title\": \"").append(escapeJson(title)).append("\",\n");
                json.append("      \"date\": \"").append(eventDate.toString()).append("\",\n");
                json.append("      \"venue\": \"").append(escapeJson(venue)).append("\",\n");
                json.append("      \"description\": \"").append(escapeJson(description)).append("\",\n");
                json.append("      \"formatted_date\": \"").append(formatDateForQuebec(eventDate)).append("\"\n");
                json.append("    }");
            }
            
        } catch (SQLException e) {
            // Return error JSON
            return "{\"error\": \"Erreur de base de données: " + e.getMessage() + "\"}";
        }
        
        json.append("\n  ]\n}");
        return json.toString();
    }
    
    /**
     * Utility method to escape HTML characters
     */
    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                  .replace("<", "&lt;")
                  .replace(">", "&gt;")
                  .replace("\"", "&quot;")
                  .replace("'", "&#39;");
    }
    
    /**
     * Utility method to escape JSON characters
     */
    private String escapeJson(String text) {
        if (text == null) return "";
        return text.replace("\\", "\\\\")
                  .replace("\"", "\\\"")
                  .replace("\n", "\\n")
                  .replace("\r", "\\r")
                  .replace("\t", "\\t");
    }
    
    /**
     * Returns error message HTML
     */
    private String getErrorMessage() {
        return """
            <div class="dates-section">
                <h2>PROCHAINS SPECTACLES</h2>
                <div class="error-message">
                    <p>Problème technique temporaire.</p>
                    <p>Consultez nos réseaux sociaux pour les dernières dates!</p>
                </div>
            </div>
            """;
    }
}