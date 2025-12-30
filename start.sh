#!/bin/bash
# Script de démarrage pour l'interface web d'extraction DVD

echo "🚀 Démarrage de l'interface d'extraction DVD"
echo ""

# Vérifier que les dépendances sont installées
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    exit 1
fi

# Démarrer le backend
echo "📦 Démarrage du serveur backend..."
cd server
if [ ! -d "node_modules" ]; then
    echo "⚠️  Installation des dépendances backend..."
    npm install
fi
npm start &
BACKEND_PID=$!
cd ..

# Attendre un peu que le backend démarre
sleep 2

# Démarrer le frontend
echo "🎨 Démarrage de l'interface frontend..."
if [ ! -d "node_modules" ]; then
    echo "⚠️  Installation des dépendances frontend..."
    npm install
fi
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Interface démarrée !"
echo "   Backend:  http://localhost:3001"
echo "   Frontend: http://localhost:5173"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter"

# Attendre que les processus se terminent
wait $BACKEND_PID $FRONTEND_PID

