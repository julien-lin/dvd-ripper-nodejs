#!/bin/bash
#==============================================================================
# Script de conversion DVD vers MP4 (Version Professionnelle)
# Description : Convertit chaque titre VTS d'un DVD en fichier MP4
# Auteur      : Optimisé pour gestion robuste des erreurs DVD
# Version     : 2.0
#==============================================================================

set -o pipefail  # Arrête le script si une commande échoue dans un pipe

#------------------------------------------------------------------------------
# CONFIGURATION
#------------------------------------------------------------------------------
DVD_PATH="/media/julien/LG_VDR/VIDEO_TS"
OUTPUT_DIR="/home/julien/Videos/DVD_Convert10"
LOG_FILE="$OUTPUT_DIR/conversion.log"

# Paramètres de conversion
VIDEO_CODEC="libx264"
VIDEO_PRESET="medium"        # slow/medium/fast - medium = bon compromis qualité/vitesse
VIDEO_CRF="18"               # 18-23 recommandé (18 = excellente qualité)
AUDIO_CODEC="aac"
AUDIO_BITRATE="192k"

# Options de récupération d'erreurs
MAX_ERROR_RATE="0.05"        # Taux max d'erreurs toléré (5%)
SKIP_DAMAGED_THRESHOLD="10"  # Nombre de secondes minimum pour accepter la vidéo

#------------------------------------------------------------------------------
# FONCTIONS UTILITAIRES
#------------------------------------------------------------------------------

# Affichage formaté avec timestamp
log() {
    local level="$1"
    shift
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $*" | tee -a "$LOG_FILE"
}

# Vérifie les dépendances
check_dependencies() {
    local missing=0
    for cmd in ffmpeg ffprobe; do
        if ! command -v "$cmd" &>/dev/null; then
            log "ERROR" "Commande manquante: $cmd"
            missing=1
        fi
    done
    return $missing
}

# Obtient la durée totale d'un VTS
get_vts_duration() {
    local concat_input="$1"
    ffprobe -v error -show_entries format=duration \
        -of default=noprint_wrappers=1:nokey=1 \
        "concat:$concat_input" 2>/dev/null || echo "0"
}

# Obtient la durée du fichier de sortie
get_output_duration() {
    local file="$1"
    ffprobe -v error -show_entries format=duration \
        -of default=noprint_wrappers=1:nokey=1 \
        "$file" 2>/dev/null || echo "0"
}

# Convertit un VTS avec gestion d'erreurs robuste
convert_vts() {
    local vts="$1"
    local files="$2"
    local output_file="$3"
    local temp_file="${output_file%.mp4}_temp.mp4"
    
    log "INFO" "Extraction de VTS_$vts vers $output_file"
    
    # Durée attendue
    local expected_duration
    expected_duration=$(get_vts_duration "$files")
    log "INFO" "Durée attendue: ${expected_duration}s"
    
    # Conversion avec options de récupération d'erreurs
    ffmpeg -y \
        -err_detect ignore_err \
        -fflags +genpts+igndts \
        -i "concat:$files" \
        -max_muxing_queue_size 9999 \
        -vf "yadif=mode=send_frame:parity=auto,setpts=PTS-STARTPTS" \
        -c:v "$VIDEO_CODEC" \
        -preset "$VIDEO_PRESET" \
        -crf "$VIDEO_CRF" \
        -max_error_rate "$MAX_ERROR_RATE" \
        -c:a "$AUDIO_CODEC" \
        -b:a "$AUDIO_BITRATE" \
        -af "aresample=async=1:first_pts=0" \
        -movflags +faststart \
        -async 1 \
        -vsync cfr \
        "$temp_file" 2>&1 | tee -a "$LOG_FILE"
    
    local ffmpeg_exit_code=${PIPESTATUS[0]}
    
    # Vérification du résultat
    if [[ $ffmpeg_exit_code -eq 0 && -f "$temp_file" ]]; then
        local actual_duration
        actual_duration=$(get_output_duration "$temp_file")
        local file_size
        file_size=$(stat -c%s "$temp_file" 2>/dev/null || echo "0")
        
        log "INFO" "Durée obtenue: ${actual_duration}s | Taille: $((file_size / 1024))KB"
        
        # Vérifier si la vidéo est exploitable
        if (( $(echo "$actual_duration > $SKIP_DAMAGED_THRESHOLD" | bc -l) )); then
            mv "$temp_file" "$output_file"
            
            # Calcul du pourcentage de perte
            if (( $(echo "$expected_duration > 0" | bc -l) )); then
                local loss_percent
                loss_percent=$(echo "scale=2; (1 - $actual_duration / $expected_duration) * 100" | bc)
                if (( $(echo "$loss_percent > 5" | bc -l) )); then
                    log "WARN" "VTS_$vts: Perte de ${loss_percent}% de la durée (erreurs DVD)"
                else
                    log "OK" "VTS_$vts: Conversion réussie (perte: ${loss_percent}%)"
                fi
            else
                log "OK" "VTS_$vts: Conversion réussie"
            fi
            return 0
        else
            log "ERROR" "VTS_$vts: Vidéo trop courte (${actual_duration}s) - possiblement corrompue"
            rm -f "$temp_file"
            return 1
        fi
    else
        log "ERROR" "VTS_$vts: Échec de la conversion (code: $ffmpeg_exit_code)"
        rm -f "$temp_file"
        return 1
    fi
}

#------------------------------------------------------------------------------
# MAIN
#------------------------------------------------------------------------------

main() {
    log "INFO" "========== DÉBUT DE LA CONVERSION DVD =========="
    log "INFO" "Source: $DVD_PATH"
    log "INFO" "Destination: $OUTPUT_DIR"
    
    # Vérifications préliminaires
    if ! check_dependencies; then
        log "ERROR" "Dépendances manquantes. Installation requise."
        exit 1
    fi
    
    if [[ ! -d "$DVD_PATH" ]]; then
        log "ERROR" "Répertoire DVD introuvable: $DVD_PATH"
        exit 1
    fi
    
    mkdir -p "$OUTPUT_DIR"
    
    # Compteurs statistiques
    local total=0
    local success=0
    local failed=0
    
    # Boucle sur tous les VTS
    for vts in $(find "$DVD_PATH" -name 'VTS_*_*.VOB' | \
                 grep -oP 'VTS_\d{2}' | sort -u | sed 's/VTS_//'); do
        
        # Liste tous les VOB pour ce VTS
        local files
        files=$(find "$DVD_PATH" -name "VTS_${vts}_*.VOB" | sort | tr '\n' '|')
        files=${files%|}
        
        if [[ -z "$files" ]]; then
            log "WARN" "Aucun fichier VOB trouvé pour VTS_$vts"
            continue
        fi
        
        ((total++))
        
        local output_file="$OUTPUT_DIR/video_$vts.mp4"
        
        if convert_vts "$vts" "$files" "$output_file"; then
            ((success++))
        else
            ((failed++))
        fi
        
        echo ""  # Ligne vide pour lisibilité
    done
    
    # Rapport final
    log "INFO" "========== CONVERSION TERMINÉE =========="
    log "INFO" "Total: $total | Succès: $success | Échecs: $failed"
    log "INFO" "Fichiers disponibles dans: $OUTPUT_DIR"
    log "INFO" "Log détaillé: $LOG_FILE"
    
    return $failed
}

# Lancement du script
main "$@"
exit $?
