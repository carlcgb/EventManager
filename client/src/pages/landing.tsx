

export default function Landing() {
  return (
    <div className="min-h-screen bg-western-gradient flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 animate-bounce delay-1000">
          <div className="w-12 h-12 bg-western-brown/10 rounded-full opacity-20"></div>
        </div>
        <div className="absolute top-32 right-20 animate-pulse delay-500">
          <div className="w-8 h-8 bg-western-sand/15 rounded-lg opacity-15"></div>
        </div>
        <div className="absolute bottom-20 left-1/4 animate-bounce delay-700">
          <div className="w-10 h-10 bg-western-chocolate/10 rounded-full opacity-10"></div>
        </div>
        <div className="absolute top-1/2 right-10 animate-pulse delay-300">
          <div className="w-6 h-6 bg-western-warning/20 rounded-full opacity-20"></div>
        </div>
      </div>
      
      <div className="max-w-2xl w-full space-y-8 relative z-10">
        {/* Hero Section - With Animations */}
        <div className="text-center space-y-6 animate-fade-in">
          <div className="flex justify-center animate-slide-down">
            <div className="w-24 h-24 bg-western-brown rounded-full flex items-center justify-center shadow-western-lg animate-pulse">
              <i className="fas fa-hat-cowboy text-western-beige text-4xl"></i>
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-western-dark animate-slide-up">
              Sam Hébert
            </h1>
            <h2 className="text-2xl text-western-brown font-semibold animate-slide-up delay-200">
              Le Cowboy de l'Humour
            </h2>
            <p className="text-xl text-gray-700 max-w-lg mx-auto animate-fade-in delay-400">
              Gestionnaire d'événements personnel pour organiser vos spectacles, 
              gérer votre calendrier et publier sur votre site web.
            </p>
          </div>
        </div>

        {/* Login Form - Moved Before Features */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-xl p-8 shadow-western-lg border-2 border-western-brown animate-fade-in delay-400">
            <a 
              href="/api/login"
              className="inline-flex items-center bg-gradient-to-r from-western-brown to-western-chocolate hover:from-western-chocolate hover:to-western-brown text-white font-bold py-4 px-10 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-western-lg text-lg shadow-lg"
            >
              <i className="fab fa-google mr-3 text-xl text-white"></i>
              Se connecter avec Google
            </a>
          </div>
        </div>

        {/* Features Overview - With Animations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center space-y-3 bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-western-lg border border-western-sand hover:border-western-brown transition-all duration-300 transform hover:scale-105 animate-slide-up hover-western">
            <div className="w-16 h-16 bg-western-brown/10 rounded-full flex items-center justify-center mx-auto shadow-western animate-bounce">
              <i className="fas fa-calendar-plus text-western-brown text-2xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-western-dark">Créer des événements</h3>
            <p className="text-gray-600 text-sm">Organisez facilement vos spectacles et événements</p>
          </div>
          <div className="text-center space-y-3 bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-western-lg border border-western-sand hover:border-western-brown transition-all duration-300 transform hover:scale-105 animate-slide-up delay-200 hover-western">
            <div className="w-16 h-16 bg-western-success/10 rounded-full flex items-center justify-center mx-auto shadow-western animate-bounce delay-300">
              <i className="fas fa-calendar-check text-western-success text-2xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-western-dark">Gérer le calendrier</h3>
            <p className="text-gray-600 text-sm">Synchronisez avec votre calendrier personnel</p>
          </div>
          <div className="text-center space-y-3 bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-western-lg border border-western-sand hover:border-western-brown transition-all duration-300 transform hover:scale-105 animate-slide-up delay-400 hover-western">
            <div className="w-16 h-16 bg-western-warning/10 rounded-full flex items-center justify-center mx-auto shadow-western animate-bounce delay-600">
              <i className="fas fa-globe text-western-warning text-2xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-western-dark">Publier en ligne</h3>
            <p className="text-gray-600 text-sm">Affichez vos événements sur votre site web</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-600">
          <p className="text-sm">
            © 2025 Sam Hébert - Gestionnaire d'Événements
          </p>
        </div>
      </div>
    </div>
  );
}
