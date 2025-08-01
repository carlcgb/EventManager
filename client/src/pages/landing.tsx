export default function Landing() {
  return (
    <div className="min-h-screen bg-black/30 backdrop-blur-[1px] flex items-center justify-center p-4 relative overflow-hidden">
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
            <h1 className="text-5xl font-bold text-white animate-slide-up">
              Booking.samhebert.ca
            </h1>
            <h2 className="text-2xl text-white font-semibold animate-slide-up delay-200">
              Gestionnaire d'événements
            </h2>
            <p className="text-xl text-white max-w-lg mx-auto animate-fade-in delay-400">
              Assistant personnel pour organiser vos spectacles, gérer votre
              calendrier et publier sur votre site web.
            </p>
          </div>
        </div>

        {/* Login Form - Updated for Google-only authentication */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-xl p-8 shadow-western-lg border-2 border-western-brown animate-fade-in delay-400">
            <div className="text-center space-y-4">
              <p className="text-gray-700 font-medium">Connexion sécurisée avec Google</p>
              <a
                href="/login"
                className="inline-flex items-center bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 font-medium py-4 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg text-base gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuer avec Google
              </a>
            </div>
          </div>
        </div>

        {/* Features Overview - With Animations */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center space-y-3 bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-western-lg border border-western-sand hover:border-western-brown transition-all duration-300 transform hover:scale-105 animate-slide-up hover-western">
            <div className="w-16 h-16 bg-western-brown/10 rounded-full flex items-center justify-center mx-auto shadow-western animate-bounce">
              <i className="fas fa-calendar-plus text-western-brown text-2xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-western-dark">
              Créer des événements
            </h3>
            <p className="text-gray-600 text-sm">
              Organisez facilement vos spectacles et événements
            </p>
          </div>
          <div className="text-center space-y-3 bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-western-lg border border-western-sand hover:border-western-brown transition-all duration-300 transform hover:scale-105 animate-slide-up delay-200 hover-western">
            <div className="w-16 h-16 bg-western-success/10 rounded-full flex items-center justify-center mx-auto shadow-western animate-bounce delay-300">
              <i className="fas fa-calendar-check text-western-success text-2xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-western-dark">
              Gérer le calendrier
            </h3>
            <p className="text-gray-600 text-sm">
              Synchronisez avec votre calendrier personnel
            </p>
          </div>
          <div className="text-center space-y-3 bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-western-lg border border-western-sand hover:border-western-brown transition-all duration-300 transform hover:scale-105 animate-slide-up delay-400 hover-western">
            <div className="w-16 h-16 bg-western-warning/10 rounded-full flex items-center justify-center mx-auto shadow-western animate-bounce delay-600">
              <i className="fas fa-globe text-western-warning text-2xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-western-dark">
              Publier en ligne
            </h3>
            <p className="text-gray-600 text-sm">
              Affichez vos événements sur votre site web
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-white">
          <p className="text-sm">© 2025 CGB - Gestionnaire d'Événements</p>
        </div>
      </div>
    </div>
  );
}
