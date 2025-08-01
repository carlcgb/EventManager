import { useLocation } from "wouter";

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background western elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 text-amber-200 text-6xl opacity-20">🤠</div>
        <div className="absolute top-20 right-20 text-amber-200 text-4xl opacity-20">⭐</div>
        <div className="absolute bottom-20 left-20 text-amber-200 text-5xl opacity-20">🏜️</div>
        <div className="absolute bottom-10 right-10 text-amber-200 text-4xl opacity-20">🌵</div>
        <div className="absolute top-1/2 left-1/4 text-amber-200 text-3xl opacity-10">🐎</div>
        <div className="absolute top-1/3 right-1/3 text-amber-200 text-2xl opacity-15">⚡</div>
      </div>
      
      <div className="max-w-4xl w-full space-y-12 relative z-10">
        {/* Hero Section */}
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-6xl font-bold text-amber-800 drop-shadow-lg">
              Booking.samhebert.ca
            </h1>
            <h2 className="text-3xl text-amber-700 font-semibold">
              Gestionnaire d'événements
            </h2>
            <p className="text-xl text-amber-600 max-w-2xl mx-auto leading-relaxed">
              Assistant personnel pour organiser vos spectacles, 
              gérer votre calendrier et publier sur votre site web en quelques clics.
            </p>
          </div>

          {/* Call to Action Buttons */}
          <div className="flex justify-center gap-6 pt-8">
            <button 
              onClick={() => setLocation('/register')}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg text-lg flex items-center gap-3"
            >
              <span className="text-2xl">🤠</span>
              Créer un compte
            </button>
            <button 
              onClick={() => setLocation('/login')}
              className="bg-white hover:bg-gray-50 text-amber-700 border-2 border-amber-600 font-bold py-4 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg text-lg"
            >
              Se connecter
            </button>
          </div>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center space-y-4 bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-xl border border-amber-200 hover:border-amber-400 transition-all duration-300 transform hover:scale-105">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-3xl">📅</span>
            </div>
            <h3 className="text-xl font-semibold text-amber-800">Créer des événements</h3>
            <p className="text-amber-600">Organisez facilement vos spectacles et événements avec notre interface intuitive</p>
          </div>
          
          <div className="text-center space-y-4 bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-xl border border-amber-200 hover:border-amber-400 transition-all duration-300 transform hover:scale-105">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-3xl">🗓️</span>
            </div>
            <h3 className="text-xl font-semibold text-amber-800">Gérer le calendrier</h3>
            <p className="text-amber-600">Synchronisez avec Google Calendar et gérez tous vos événements en un seul endroit</p>
          </div>
          
          <div className="text-center space-y-4 bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-xl border border-amber-200 hover:border-amber-400 transition-all duration-300 transform hover:scale-105">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-3xl">🌐</span>
            </div>
            <h3 className="text-xl font-semibold text-amber-800">Publier en ligne</h3>
            <p className="text-amber-600">Affichez vos événements sur votre site web avec liens Google Maps</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-8">
          <p className="text-amber-600">
            © 2025 CGB - Gestionnaire d'Événements
          </p>
        </div>
      </div>
    </div>
  );
}