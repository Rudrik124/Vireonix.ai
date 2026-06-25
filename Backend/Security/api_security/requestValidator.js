/**
 * Request Validator Module
 * 
 * Purpose: Validate all incoming API requests for:
 * - Required fields present
 * - Correct data types
 * - Missing parameters
 * - Invalid formats
 * 
 * Flow: Request → Validate → Pass/Fail
 */

class RequestValidator {
  constructor(options = {}) {
    this.maxRequestSize = options.maxRequestSize || 1048576; // 1MB
    this.maxFieldLength = options.maxFieldLength || 10000;
    this.stats = {
      totalRequests: 0,
      validRequests: 0,
      invalidRequests: 0,
      validationErrors: {}
    };
  }

  /**
   * Validate incoming request against schema
   * 
   * @param {object} data - Request data to validate
   * @param {object} schema - Validation schema
   * @returns {object} - { isValid, errors, warnings, data }
   */
  validate(data, schema) {
    this.stats.totalRequests++;

    if (!data || !schema) {
      this.stats.invalidRequests++;
      return {
        isValid: false,
        errors: ['Invalid input: data and schema required'],
        warnings: [],
        data: null
      };
    }

    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      data: { ...data }
    };

    // Check required fields
    if (schema.required && Array.isArray(schema.required)) {
      for (const field of schema.required) {
        if (!(field in data)) {
          result.errors.push(`Missing required field: ${field}`);
          result.isValid = false;
        }
      }
    }

    // Validate fields against schema
    if (schema.fields && typeof schema.fields === 'object') {
      for (const [fieldName, fieldSchema] of Object.entries(schema.fields)) {
        if (fieldName in data) {
          const fieldValidation = this.validateField(fieldName, data[fieldName], fieldSchema);
          
          if (!fieldValidation.isValid) {
            result.errors.push(...fieldValidation.errors);
            result.isValid = false;
          }
          
          if (fieldValidation.warnings.length > 0) {
            result.warnings.push(...fieldValidation.warnings);
          }

          // Update data with cleaned value if provided
          if (fieldValidation.cleanedValue !== undefined) {
            result.data[fieldName] = fieldValidation.cleanedValue;
          }
        }
      }
    }

    // Update statistics
    if (result.isValid) {
      this.stats.validRequests++;
    } else {
      this.stats.invalidRequests++;
      // Track error types
      for (const error of result.errors) {
        const errorType = error.split(':')[0];
        this.stats.validationErrors[errorType] = (this.stats.validationErrors[errorType] || 0) + 1;
      }
    }

    return result;
  }

  /**
   * Validate individual field
   * 
   * @param {string} fieldName - Field name
   * @param {*} value - Field value
   * @param {object} fieldSchema - Field schema (type, pattern, min, max, enum, etc.)
   * @returns {object} - { isValid, errors, warnings, cleanedValue }
   */
  validateField(fieldName, value, fieldSchema = {}) {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      cleanedValue: undefined
    };

    // Check type if specified
    if (fieldSchema.type) {
      const typeCheck = this.checkType(value, fieldSchema.type);
      if (!typeCheck.isValid) {
        result.errors.push(`${fieldName}: Expected ${fieldSchema.type}, got ${typeof value}`);
        result.isValid = false;
        return result;
      }
    }

    // Check length (for strings)
    if (typeof value === 'string') {
      if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
        result.errors.push(`${fieldName}: Minimum length is ${fieldSchema.minLength}`);
        result.isValid = false;
      }
      if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
        result.errors.push(`${fieldName}: Maximum length is ${fieldSchema.maxLength}`);
        result.isValid = false;
      }
      if (value.length > this.maxFieldLength) {
        result.errors.push(`${fieldName}: Exceeds maximum field length`);
        result.isValid = false;
      }
    }

    // Check pattern (regex)
    if (fieldSchema.pattern && typeof value === 'string') {
      const pattern = new RegExp(fieldSchema.pattern);
      if (!pattern.test(value)) {
        result.errors.push(`${fieldName}: Invalid format - does not match pattern`);
        result.isValid = false;
      }
    }

    // Check enum
    if (fieldSchema.enum && Array.isArray(fieldSchema.enum)) {
      if (!fieldSchema.enum.includes(value)) {
        result.errors.push(`${fieldName}: Must be one of [${fieldSchema.enum.join(', ')}]`);
        result.isValid = false;
      }
    }

    // Check numeric range
    if (typeof value === 'number') {
      if (fieldSchema.min !== undefined && value < fieldSchema.min) {
        result.errors.push(`${fieldName}: Minimum value is ${fieldSchema.min}`);
        result.isValid = false;
      }
      if (fieldSchema.max !== undefined && value > fieldSchema.max) {
        result.errors.push(`${fieldName}: Maximum value is ${fieldSchema.max}`);
        result.isValid = false;
      }
    }

    // Check array properties
    if (Array.isArray(value)) {
      if (fieldSchema.minItems && value.length < fieldSchema.minItems) {
        result.errors.push(`${fieldName}: Minimum ${fieldSchema.minItems} items required`);
        result.isValid = false;
      }
      if (fieldSchema.maxItems && value.length > fieldSchema.maxItems) {
        result.errors.push(`${fieldName}: Maximum ${fieldSchema.maxItems} items allowed`);
        result.isValid = false;
      }
    }

    // Trim strings if specified
    if (typeof value === 'string' && fieldSchema.trim) {
      result.cleanedValue = value.trim();
    }

    return result;
  }

  /**
   * Check if value matches expected type
   * 
   * @param {*} value - Value to check
   * @param {string} expectedType - Expected type (string, number, boolean, object, array, email, url, etc.)
   * @returns {object} - { isValid }
   */
  checkType(value, expectedType) {
    const type = typeof value;

    switch (expectedType) {
      case 'string':
        return { isValid: type === 'string' };
      case 'number':
        return { isValid: type === 'number' && !isNaN(value) };
      case 'integer':
        return { isValid: Number.isInteger(value) };
      case 'boolean':
        return { isValid: type === 'boolean' };
      case 'object':
        return { isValid: type === 'object' && value !== null && !Array.isArray(value) };
      case 'array':
        return { isValid: Array.isArray(value) };
      case 'email':
        return { isValid: this.isValidEmail(value) };
      case 'url':
        return { isValid: this.isValidUrl(value) };
      case 'uuid':
        return { isValid: this.isValidUuid(value) };
      case 'date':
        return { isValid: this.isValidDate(value) };
      case 'phone':
        return { isValid: this.isValidPhone(value) };
      default:
        return { isValid: type === expectedType };
    }
  }

  /**
   * Validate email format
   */
  isValidEmail(email) {
    if (typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  /**
   * Validate URL format
   */
  isValidUrl(url) {
    if (typeof url !== 'string') return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate UUID format
   */
  isValidUuid(uuid) {
    if (typeof uuid !== 'string') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Validate date format
   */
  isValidDate(date) {
    if (typeof date === 'string') {
      return !isNaN(Date.parse(date));
    }
    if (date instanceof Date) {
      return !isNaN(date.getTime());
    }
    return false;
  }

  /**
   * Validate phone format
   */
  isValidPhone(phone) {
    if (typeof phone !== 'string') return false;
    // Basic phone validation (can be customized)
    const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Check request size
   * 
   * @param {number} size - Request size in bytes
   * @returns {object} - { isValid, message }
   */
  checkRequestSize(size) {
    if (size > this.maxRequestSize) {
      return {
        isValid: false,
        message: `Request exceeds maximum size of ${this.maxRequestSize} bytes`
      };
    }
    return { isValid: true, message: 'OK' };
  }

  /**
   * Validate request headers
   * 
   * @param {object} headers - Request headers
   * @param {array} required - Required header names
   * @returns {object} - { isValid, missing, invalid }
   */
  validateHeaders(headers = {}, required = []) {
    const result = {
      isValid: true,
      missing: [],
      invalid: []
    };

    for (const headerName of required) {
      const headerLower = headerName.toLowerCase();
      const hasHeader = Object.keys(headers).some(h => h.toLowerCase() === headerLower);
      
      if (!hasHeader) {
        result.missing.push(headerName);
        result.isValid = false;
      }
    }

    // Validate header format
    for (const [name, value] of Object.entries(headers)) {
      if (typeof value !== 'string' && !Array.isArray(value)) {
        result.invalid.push(`${name}: Invalid header value type`);
        result.isValid = false;
      }
    }

    return result;
  }

  /**
   * Validate query parameters
   * 
   * @param {object} query - Query parameters
   * @param {object} schema - Query schema
   * @returns {object} - Validation result
   */
  validateQueryParams(query = {}, schema = {}) {
    return this.validate(query, schema);
  }

  /**
   * Validate body payload
   * 
   * @param {object} body - Request body
   * @param {object} schema - Body schema
   * @returns {object} - Validation result
   */
  validateBody(body = {}, schema = {}) {
    return this.validate(body, schema);
  }

  /**
   * Get validation statistics
   */
  getStats() {
    return {
      ...this.stats,
      validationRate: this.stats.totalRequests > 0
        ? ((this.stats.validRequests / this.stats.totalRequests) * 100).toFixed(2) + '%'
        : '0%',
      errorRate: this.stats.totalRequests > 0
        ? ((this.stats.invalidRequests / this.stats.totalRequests) * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalRequests: 0,
      validRequests: 0,
      invalidRequests: 0,
      validationErrors: {}
    };
  }
}

module.exports = RequestValidator;