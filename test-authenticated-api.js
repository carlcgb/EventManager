/**
 * Script de test pour les APIs authentifiées
 * Usage: node test-authenticated-api.js
 */

// Configuration
const BASE_URL = 'http://localhost:5000'; // Changez pour votre URL Replit
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'password123';

// Fonction utilitaire pour les requêtes
async function makeRequest(url, options = {}) {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Important pour les cookies
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  
  console.log(`${options.method || 'GET'} ${url} - Status: ${response.status}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }
  
  return response.json();
}

// Test 1: API publique (pas d'authentification)
async function testPublicAPI() {
  console.log('\n🌐 Test API publique...');
  try {
    const events = await makeRequest(`${BASE_URL}/api/public/events`);
    console.log('✅ API publique OK:', events.length, 'événements');
    return true;
  } catch (error) {
    console.log('❌ Erreur API publique:', error.message);
    return false;
  }
}

// Test 2: API privée sans authentification (doit échouer)
async function testPrivateAPIWithoutAuth() {
  console.log('\n🔒 Test API privée sans auth (doit échouer)...');
  try {
    await makeRequest(`${BASE_URL}/api/events`);
    console.log('❌ PROBLÈME: API privée accessible sans auth!');
    return false;
  } catch (error) {
    if (error.message.includes('401')) {
      console.log('✅ API privée protégée correctement (401)');
      return true;
    } else {
      console.log('❌ Erreur inattendue:', error.message);
      return false;
    }
  }
}

// Test 3: Connexion par email/password
async function testLogin() {
  console.log('\n🔑 Test connexion email/password...');
  try {
    const result = await makeRequest(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    });
    console.log('✅ Connexion réussie:', result);
    return true;
  } catch (error) {
    console.log('❌ Échec connexion:', error.message);
    return false;
  }
}

// Test 4: API privée après connexion
async function testPrivateAPIWithAuth() {
  console.log('\n🔐 Test API privée après connexion...');
  try {
    // Test récupération utilisateur
    const user = await makeRequest(`${BASE_URL}/api/auth/user`);
    console.log('✅ Utilisateur connecté:', user.email);

    // Test récupération événements
    const events = await makeRequest(`${BASE_URL}/api/events`);
    console.log('✅ Événements privés:', events.length, 'événements');

    // Test statistiques
    const stats = await makeRequest(`${BASE_URL}/api/events/stats`);
    console.log('✅ Statistiques:', stats);

    return true;
  } catch (error) {
    console.log('❌ Erreur API privée:', error.message);
    return false;
  }
}

// Test 5: Création d'un événement
async function testCreateEvent() {
  console.log('\n➕ Test création événement...');
  try {
    const newEvent = {
      title: 'Événement de test',
      description: 'Créé par le script de test',
      date: new Date().toISOString().split('T')[0],
      time: '20:00',
      venue: 'Lieu de test',
      addToCalendar: false,
      publishToWebsite: true,
      sendNotification: false
    };

    const result = await makeRequest(`${BASE_URL}/api/events`, {
      method: 'POST',
      body: JSON.stringify(newEvent)
    });
    
    console.log('✅ Événement créé:', result.id);
    return result.id;
  } catch (error) {
    console.log('❌ Erreur création événement:', error.message);
    return null;
  }
}

// Test 6: Déconnexion
async function testLogout() {
  console.log('\n🚪 Test déconnexion...');
  try {
    await fetch(`${BASE_URL}/api/logout`, {
      method: 'GET',
      credentials: 'include'
    });
    console.log('✅ Déconnexion effectuée');
    return true;
  } catch (error) {
    console.log('❌ Erreur déconnexion:', error.message);
    return false;
  }
}

// Test 7: Vérification après déconnexion
async function testAfterLogout() {
  console.log('\n🔒 Test accès après déconnexion...');
  try {
    await makeRequest(`${BASE_URL}/api/auth/user`);
    console.log('❌ PROBLÈME: Accès autorisé après déconnexion!');
    return false;
  } catch (error) {
    if (error.message.includes('401')) {
      console.log('✅ Accès bloqué après déconnexion');
      return true;
    } else {
      console.log('❌ Erreur inattendue:', error.message);
      return false;
    }
  }
}

// Fonction principale
async function runAllTests() {
  console.log('🧪 Début des tests API...');
  console.log('URL de base:', BASE_URL);
  
  const results = {
    public: await testPublicAPI(),
    protectedWithoutAuth: await testPrivateAPIWithoutAuth(),
    login: await testLogin(),
    protectedWithAuth: false,
    createEvent: false,
    logout: false,
    afterLogout: false
  };

  // Tests qui nécessitent une connexion
  if (results.login) {
    results.protectedWithAuth = await testPrivateAPIWithAuth();
    results.createEvent = !!(await testCreateEvent());
    results.logout = await testLogout();
    results.afterLogout = await testAfterLogout();
  }

  // Résumé
  console.log('\n📊 RÉSUMÉ DES TESTS:');
  console.log('='.repeat(40));
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${test}: ${passed ? 'PASS' : 'FAIL'}`);
  });

  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  console.log(`\nRésultat global: ${passedTests}/${totalTests} tests réussis`);

  if (passedTests === totalTests) {
    console.log('🎉 Tous les tests sont passés! Votre API fonctionne correctement.');
  } else {
    console.log('⚠️ Certains tests ont échoué. Vérifiez votre configuration.');
  }
}

// Exécution si le script est lancé directement
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testPublicAPI,
  testLogin,
  testPrivateAPIWithAuth,
  makeRequest
};