import { SimpleLogin } from "@/components/SimpleLogin";

export default function Landing() {
  return (
    <div className="min-h-screen bg-western-gradient flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-western-brown rounded-full flex items-center justify-center shadow-western-lg">
              <i className="fas fa-hat-cowboy text-western-beige text-4xl"></i>
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-western-dark">
              Sam Hébert
            </h1>
            <h2 className="text-2xl text-western-brown font-semibold">
              Le Cowboy de l'Humour
            </h2>
            <p className="text-xl text-gray-700 max-w-lg mx-auto">
              Gestionnaire d'événements personnel pour organiser vos spectacles, 
              gérer votre calendrier et publier sur votre site web.
            </p>
          </div>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-western-sand rounded-lg flex items-center justify-center mx-auto shadow-western">
              <i className="fas fa-calendar-plus text-western-brown text-2xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-western-dark">Créer des événements</h3>
            <p className="text-gray-600 text-sm">Organisez facilement vos spectacles et événements</p>
          </div>
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-western-sand rounded-lg flex items-center justify-center mx-auto shadow-western">
              <i className="fas fa-calendar-check text-western-brown text-2xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-western-dark">Gérer le calendrier</h3>
            <p className="text-gray-600 text-sm">Synchronisez avec votre calendrier personnel</p>
          </div>
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-western-sand rounded-lg flex items-center justify-center mx-auto shadow-western">
              <i className="fas fa-globe text-western-brown text-2xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-western-dark">Publier en ligne</h3>
            <p className="text-gray-600 text-sm">Affichez vos événements sur votre site web</p>
          </div>
        </div>

        {/* Login Form */}
        <div className="flex justify-center">
          <SimpleLogin />
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
