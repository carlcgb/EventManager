// Utility functions for data processing

/**
 * Extract city from a full address
 * Handles Quebec address formats like:
 * "La Taverne de Chambly, 1737 Av. Bourgogne, Chambly, QC J3L 1Y8"
 */
export function extractCityFromAddress(address: string): string {
  if (!address) return '';
  
  // Split by commas and clean up each part
  const parts = address.split(',').map(part => part.trim());
  
  // For Quebec addresses, the city is typically the third-to-last part
  // Format: "Name, Street Address, City, Province Postal"
  if (parts.length >= 3) {
    const cityPart = parts[parts.length - 2]; // Get the part before "QC ..."
    return cityPart.trim();
  }
  
  // Fallback: try to find a city name in the address
  const cityKeywords = ['Chambly', 'Montréal', 'Québec', 'Laval', 'Gatineau', 'Longueuil', 'Sherbrooke', 'Saguenay', 'Lévis', 'Trois-Rivières', 'Terrebonne', 'Saint-Jean-sur-Richelieu', 'Granby', 'Drummondville', 'Saint-Jérôme', 'Chicoutimi', 'Saint-Hyacinthe', 'Shawinigan', 'Dollard-des-Ormeaux', 'Blainville'];
  
  for (const keyword of cityKeywords) {
    if (address.toLowerCase().includes(keyword.toLowerCase())) {
      return keyword;
    }
  }
  
  return '';
}

/**
 * Extract venue name from the beginning of an address
 * "La Taverne de Chambly, 1737 Av. Bourgogne, Chambly, QC J3L 1Y8"
 * Returns: "La Taverne de Chambly"
 */
export function extractVenueNameFromAddress(address: string): string {
  if (!address) return '';
  
  // Split by comma and take the first part as venue name
  const parts = address.split(',');
  if (parts.length > 0) {
    return parts[0].trim();
  }
  
  return address.trim();
}