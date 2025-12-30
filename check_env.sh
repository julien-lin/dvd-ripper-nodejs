#!/bin/bash
#==============================================================================
# Script de vérification de l'environnement
#==============================================================================

echo "═══════════════════════════════════════════════════════════"
echo "  Vérification de l'environnement pour convert_dvd.sh"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

checks_passed=0
checks_failed=0

check() {
    if eval "$2" &>/dev/null; then
        echo -e "${GREEN}✓${NC} $1"
        ((checks_passed++))
        return 0
    else
        echo -e "${RED}✗${NC} $1"
        if [ -n "$3" ]; then
            echo -e "  ${YELLOW}→${NC} $3"
        fi
        ((checks_failed++))
        return 1
    fi
}

# Vérification des dépendances
echo "📦 Dépendances système"
echo "───────────────────────────────────────────────────────────"
check "ffmpeg installé" "command -v ffmpeg" "sudo apt install ffmpeg"
check "ffprobe installé" "command -v ffprobe" "sudo apt install ffmpeg"
check "bc installé" "command -v bc" "sudo apt install bc"
echo ""

# Vérification de la version FFmpeg
if command -v ffmpeg &>/dev/null; then
    echo "📊 Version FFmpeg"
    echo "───────────────────────────────────────────────────────────"
    ffmpeg -version | head -n1
    echo ""
fi

# Vérification des codecs
echo "🎬 Support des codecs"
echo "───────────────────────────────────────────────────────────"
check "Codec H.264 (libx264)" "ffmpeg -codecs 2>&1 | grep -q libx264" "sudo apt install ffmpeg"
check "Codec AAC" "ffmpeg -codecs 2>&1 | grep -q 'DEA.L. aac'" "sudo apt install ffmpeg"
check "Décodeur MPEG2" "ffmpeg -decoders 2>&1 | grep -q mpeg2video" "sudo apt install ffmpeg"
check "Décodeur AC3" "ffmpeg -decoders 2>&1 | grep -q ac3" "sudo apt install ffmpeg"
echo ""

# Vérification des chemins
echo "📁 Chemins et permissions"
echo "───────────────────────────────────────────────────────────"
DVD_PATH="/media/julien/LG_VDR/VIDEO_TS"
OUTPUT_DIR="/home/julien/Videos/DVD_Convert2"

check "Script exécutable" "test -x ./convert_dvd.sh" "chmod +x ./convert_dvd.sh"

if [ -d "$DVD_PATH" ]; then
    vob_count=$(find "$DVD_PATH" -name "VTS_*.VOB" 2>/dev/null | wc -l)
    echo -e "${GREEN}✓${NC} Répertoire DVD accessible: $DVD_PATH"
    echo -e "  ${YELLOW}→${NC} Fichiers VOB trouvés: $vob_count"
    ((checks_passed++))
else
    echo -e "${RED}✗${NC} Répertoire DVD non accessible: $DVD_PATH"
    echo -e "  ${YELLOW}→${NC} Montez votre DVD ou modifiez DVD_PATH dans le script"
    ((checks_failed++))
fi

if [ -d "$OUTPUT_DIR" ]; then
    echo -e "${GREEN}✓${NC} Répertoire de sortie: $OUTPUT_DIR"
    ((checks_passed++))
elif mkdir -p "$OUTPUT_DIR" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Répertoire de sortie créé: $OUTPUT_DIR"
    ((checks_passed++))
else
    echo -e "${RED}✗${NC} Impossible de créer: $OUTPUT_DIR"
    echo -e "  ${YELLOW}→${NC} Vérifiez les permissions"
    ((checks_failed++))
fi

if [ -w "$OUTPUT_DIR" ] || [ -w "$(dirname "$OUTPUT_DIR")" ]; then
    echo -e "${GREEN}✓${NC} Permissions d'écriture OK"
    ((checks_passed++))
else
    echo -e "${RED}✗${NC} Pas de permissions d'écriture"
    ((checks_failed++))
fi

# Estimation de l'espace disque
if [ -d "$OUTPUT_DIR" ]; then
    available_space=$(df -h "$OUTPUT_DIR" | awk 'NR==2 {print $4}')
    echo -e "  ${YELLOW}→${NC} Espace disponible: $available_space"
fi

echo ""

# Résumé
echo "═══════════════════════════════════════════════════════════"
echo -e "  Résultat: ${GREEN}$checks_passed passés${NC} | ${RED}$checks_failed échecs${NC}"
echo "═══════════════════════════════════════════════════════════"
echo ""

if [ $checks_failed -eq 0 ]; then
    echo -e "${GREEN}✓ Votre système est prêt !${NC}"
    echo ""
    echo "Pour lancer la conversion :"
    echo "  ./convert_dvd.sh"
    echo ""
    exit 0
else
    echo -e "${RED}⚠ Corrigez les erreurs avant de lancer la conversion${NC}"
    echo ""
    exit 1
fi
