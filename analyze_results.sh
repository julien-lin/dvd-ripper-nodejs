#!/bin/bash
#==============================================================================
# Analyse des conversions DVD
# Affiche un rapport détaillé des vidéos converties
#==============================================================================

OUTPUT_DIR="/home/julien/Videos/DVD_Convert2"
LOG_FILE="$OUTPUT_DIR/conversion.log"

# Couleurs
BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Rapport de conversion DVD${NC}"
echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}"
echo ""

if [ ! -d "$OUTPUT_DIR" ]; then
    echo -e "${RED}Erreur: Répertoire non trouvé: $OUTPUT_DIR${NC}"
    exit 1
fi

# Statistiques générales
total_files=$(find "$OUTPUT_DIR" -name "video_*.mp4" -type f 2>/dev/null | wc -l)
total_size=$(du -sh "$OUTPUT_DIR" 2>/dev/null | cut -f1)

echo -e "${BLUE}📊 Statistiques générales${NC}"
echo "───────────────────────────────────────────────────────────"
echo "Répertoire: $OUTPUT_DIR"
echo "Vidéos converties: $total_files"
echo "Taille totale: $total_size"
echo ""

# Détails des vidéos
if [ $total_files -gt 0 ]; then
    echo -e "${BLUE}🎬 Détails des vidéos${NC}"
    echo "───────────────────────────────────────────────────────────"
    printf "%-15s %-12s %-12s %-10s\n" "Fichier" "Durée" "Taille" "Bitrate"
    echo "───────────────────────────────────────────────────────────"
    
    for video in $(find "$OUTPUT_DIR" -name "video_*.mp4" -type f | sort); do
        filename=$(basename "$video")
        
        # Obtenir les informations avec ffprobe
        duration=$(ffprobe -v error -show_entries format=duration \
            -of default=noprint_wrappers=1:nokey=1 "$video" 2>/dev/null)
        
        size=$(du -h "$video" | cut -f1)
        
        bitrate=$(ffprobe -v error -show_entries format=bit_rate \
            -of default=noprint_wrappers=1:nokey=1 "$video" 2>/dev/null)
        
        # Formater la durée (secondes -> HH:MM:SS)
        if [ -n "$duration" ]; then
            duration_int=${duration%.*}  # Partie entière
            hours=$((duration_int / 3600))
            minutes=$(((duration_int % 3600) / 60))
            seconds=$((duration_int % 60))
            duration_fmt=$(printf "%02d:%02d:%02d" $hours $minutes $seconds)
        else
            duration_fmt="N/A"
        fi
        
        # Formater le bitrate
        if [ -n "$bitrate" ] && [ "$bitrate" != "N/A" ]; then
            bitrate_int=${bitrate%.*}  # Partie entière
            bitrate_mbps=$((bitrate_int / 1000000))
            bitrate_fmt="${bitrate_mbps} Mb/s"
        else
            bitrate_fmt="N/A"
        fi
        
        printf "%-15s %-12s %-12s %-10s\n" "$filename" "$duration_fmt" "$size" "$bitrate_fmt"
    done
    echo ""
fi

# Analyse du log si disponible
if [ -f "$LOG_FILE" ]; then
    echo -e "${BLUE}📝 Analyse du fichier log${NC}"
    echo "───────────────────────────────────────────────────────────"
    
    success_count=$(grep -c "\[OK\]" "$LOG_FILE" 2>/dev/null || echo "0")
    warn_count=$(grep -c "\[WARN\]" "$LOG_FILE" 2>/dev/null || echo "0")
    error_count=$(grep -c "\[ERROR\]" "$LOG_FILE" 2>/dev/null || echo "0")
    
    echo -e "Conversions réussies: ${GREEN}$success_count${NC}"
    echo -e "Avertissements: ${YELLOW}$warn_count${NC}"
    echo -e "Erreurs: ${RED}$error_count${NC}"
    echo ""
    
    # Afficher les avertissements
    if [ "$warn_count" -gt 0 ] 2>/dev/null; then
        echo -e "${YELLOW}⚠ Avertissements récents:${NC}"
        grep "\[WARN\]" "$LOG_FILE" | tail -n 5
        echo ""
    fi
    
    # Afficher les erreurs
    if [ "$error_count" -gt 0 ] 2>/dev/null; then
        echo -e "${RED}✗ Erreurs récentes:${NC}"
        grep "\[ERROR\]" "$LOG_FILE" | tail -n 5
        echo ""
    fi
    
    # Dernière conversion
    last_conversion=$(grep "CONVERSION TERMINÉE" "$LOG_FILE" | tail -n 1)
    if [ -n "$last_conversion" ]; then
        echo -e "${BLUE}🕐 Dernière conversion${NC}"
        echo "$last_conversion"
        echo ""
    fi
else
    warn_count=0
    error_count=0
fi

# Conseils
echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}💡 Conseils${NC}"
echo "───────────────────────────────────────────────────────────"

if [ "$warn_count" -gt 0 ] 2>/dev/null; then
    echo -e "${YELLOW}•${NC} Des pertes de données ont été détectées (>5%)"
    echo "  → Vérifiez l'état physique de votre DVD"
    echo "  → Nettoyez le disque et réessayez si nécessaire"
fi

if [ "$error_count" -gt 0 ] 2>/dev/null; then
    echo -e "${RED}•${NC} Certaines conversions ont échoué"
    echo "  → Consultez le log: $LOG_FILE"
    echo "  → Les vidéos < 10s sont automatiquement rejetées"
fi

if [ $total_files -eq 0 ]; then
    echo -e "${YELLOW}•${NC} Aucune vidéo trouvée"
    echo "  → Lancez d'abord: ./convert_dvd.sh"
fi

echo ""
echo -e "${GREEN}✓ Analyse terminée${NC}"
