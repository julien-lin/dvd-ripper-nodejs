/**
 * Schémas de validation Joi pour toutes les routes API
 * Sécurise les entrées utilisateur et prévient les injections
 */

import Joi from 'joi';

/**
 * Schéma pour le scan DVD
 */
export const scanDvdSchema = Joi.object({
  dvdPath: Joi.string()
    .required()
    .trim()
    .min(1)
    .max(500)
    .pattern(/^[a-zA-Z0-9/_\-. ]+$/, 'safe path')
    .messages({
      'string.empty': 'Le chemin DVD est requis',
      'string.min': 'Le chemin DVD doit contenir au moins 1 caractère',
      'string.max': 'Le chemin DVD est trop long (max 500 caractères)',
      'string.pattern.name': 'Le chemin DVD contient des caractères non autorisés',
      'any.required': 'Le chemin DVD est requis'
    })
});

/**
 * Schéma pour lister un répertoire
 */
export const listDirectorySchema = Joi.object({
  path: Joi.string()
    .required()
    .trim()
    .min(1)
    .max(500)
    .messages({
      'string.empty': 'Le chemin est requis',
      'string.min': 'Le chemin doit contenir au moins 1 caractère',
      'string.max': 'Le chemin est trop long (max 500 caractères)',
      'any.required': 'Le chemin est requis'
    })
});

/**
 * Schéma pour démarrer une conversion
 */
export const convertSchema = Joi.object({
  dvdPath: Joi.string()
    .required()
    .trim()
    .min(1)
    .max(500)
    .pattern(/^[a-zA-Z0-9/_\-. ]+$/, 'safe path')
    .messages({
      'string.empty': 'Le chemin DVD est requis',
      'string.pattern.name': 'Le chemin DVD contient des caractères non autorisés',
      'any.required': 'Le chemin DVD est requis'
    }),
  
  outputDir: Joi.string()
    .required()
    .trim()
    .min(1)
    .max(500)
    .pattern(/^[a-zA-Z0-9/_\-. ]+$/, 'safe path')
    .messages({
      'string.empty': 'Le répertoire de sortie est requis',
      'string.pattern.name': 'Le répertoire de sortie contient des caractères non autorisés',
      'any.required': 'Le répertoire de sortie est requis'
    }),
  
  videoPreset: Joi.string()
    .valid('slow', 'medium', 'fast')
    .default('medium')
    .messages({
      'any.only': 'Le preset vidéo doit être: slow, medium ou fast'
    }),
  
  videoCrf: Joi.string()
    .pattern(/^(1[5-9]|2[0-8])$/, 'valid CRF')
    .default('18')
    .messages({
      'string.pattern.name': 'Le CRF doit être entre 15 et 28'
    }),
  
  audioBitrate: Joi.string()
    .valid('128k', '192k', '256k', '320k')
    .default('192k')
    .messages({
      'any.only': 'Le bitrate audio doit être: 128k, 192k, 256k ou 320k'
    }),
  
  selectedVts: Joi.array()
    .items(Joi.string().pattern(/^\d{2}$/))
    .default([])
    .messages({
      'array.base': 'selectedVts doit être un tableau',
      'string.pattern.base': 'Les VTS doivent être au format 2 chiffres (ex: "01")'
    })
});

/**
 * Schéma pour analyser les résultats
 */
export const analyzeSchema = Joi.object({
  outputDir: Joi.string()
    .required()
    .trim()
    .min(1)
    .max(500)
    .messages({
      'string.empty': 'Le répertoire de sortie est requis',
      'any.required': 'Le répertoire de sortie est requis'
    })
});

/**
 * Middleware de validation Joi
 * Valide le body, query ou params selon le schéma fourni
 */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const dataToValidate = source === 'query' ? req.query : 
                          source === 'params' ? req.params : 
                          req.body;
    
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false, // Retourner toutes les erreurs
      stripUnknown: true  // Supprimer les champs non définis dans le schéma
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        error: 'Validation échouée',
        details: errors
      });
    }
    
    // Remplacer les données par les valeurs validées (avec defaults appliqués)
    if (source === 'body') req.body = value;
    else if (source === 'query') req.query = value;
    else if (source === 'params') req.params = value;
    
    next();
  };
}

/**
 * Middleware de validation pour query params
 */
export function validateQuery(schema) {
  return validate(schema, 'query');
}

/**
 * Middleware de validation pour params
 */
export function validateParams(schema) {
  return validate(schema, 'params');
}

export default {
  scanDvdSchema,
  listDirectorySchema,
  convertSchema,
  analyzeSchema,
  validate,
  validateQuery,
  validateParams
};

