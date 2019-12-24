type ValidationResult = {
  errors: ValidationErrors | null
  valid: boolean
}

export type ValidationErrors = {
  [key: string]: {
    message: string
    reason?: any
  }
}

export type ValidatorFn = {
  (value: any): ValidationErrors | null
}

export const Validators = {
  required: (value: any): ValidationErrors | null => {
    return isEmptyValue(value) ? { required: { message: '"value" is required' } } : null
  },
  min: (min: number): ValidatorFn => {
    return (value: any): ValidationErrors | null => {
      if (isEmptyValue(value) || isEmptyValue(min)) {
        return null
      }

      return !isNaN(value) && value < min
        ? {
            min: {
              message: `"value" must be greater than ${min}`,
              reason: { min, actual: value }
            }
          }
        : null
    }
  },
  max: (max: number): ValidatorFn => {
    return (value: any): ValidationErrors | null => {
      if (isEmptyValue(value) || isEmptyValue(max)) {
        return null
      }

      return !isNaN(value) && value > max
        ? {
            max: {
              message: `"value" must be less than ${max}`,
              reason: { max, actual: value }
            }
          }
        : null
    }
  },
  minLength: (minLength: number): ValidatorFn => {
    return (value: any): ValidationErrors | null => {
      if (isEmptyValue(value)) {
        return null
      }

      const length = value.length ?? 0
      return length < minLength
        ? {
            minLength: {
              message: `"value" length must be at least ${minLength} characters long`,
              reason: { requiredLength: minLength, actualLength: length }
            }
          }
        : null
    }
  },
  maxLength: (maxLength: number): ValidatorFn => {
    return (value: any): ValidationErrors | null => {
      if (isEmptyValue(value)) {
        return null
      }

      const length = value.length ?? 0
      return length > maxLength
        ? {
            maxLength: {
              message: `"value" length must be less than ${maxLength} characters long`,
              reason: { requiredLength: maxLength, actualLength: length }
            }
          }
        : null
    }
  },
  pattern: (pattern: RegExp): ValidatorFn => {
    return (value: any): ValidationErrors | null => {
      if (isEmptyValue(value)) {
        return null
      }

      return pattern.test(value)
        ? null
        : {
            pattern: {
              message: `"value" fails to match the required pattern: ${pattern}`,
              reason: {
                requiredPattern: pattern,
                actualValue: value
              }
            }
          }
    }
  }
}

export const validate = (value: any, validators: ValidatorFn | ValidatorFn[]): ValidationResult => {
  const vs = Array.isArray(validators) ? validators : [validators]
  const errors = mergeErrors(executeValidators(value, vs))
  const valid = errors === null
  if (errors !== null) {
    return { errors, valid }
  }

  return { errors, valid }
}

function isEmptyValue(value: any): boolean {
  return value === null || typeof value === 'undefined' || value.length === 0
}

function executeValidators(value: any, validators: ValidatorFn[]) {
  return validators.map(v => v(value))
}

function mergeErrors(errors: ValidationErrors[]): ValidationErrors | null {
  const result = errors.reduce((result, error) => {
    return error !== null ? { ...result, ...error } : result
  }, {})

  return Object.keys(result).length === 0 ? null : result
}
