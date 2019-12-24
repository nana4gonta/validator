import { runTests, test } from 'https://deno.land/std/testing/mod.ts'
import { assertEquals } from 'https://deno.land/std/testing/asserts.ts'

import { validate, Validators, ValidatorFn } from './validator.ts'

function generateRandomInt(start = 0, end = 100): number {
  return Math.floor(Math.random() * (end - start) + start)
}

function generateRandomString(length: number): string {
  const seed = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  return Array.from(Array(length))
    .map(() => seed[Math.floor(Math.random() * seed.length)])
    .join('')
}

test({
  name: '[Validators.required] is valid args',
  fn(): void {
    const randNum = generateRandomInt(0, 100)
    const randStr = generateRandomString(randNum)

    assertEquals(Validators.required(0), null)
    assertEquals(Validators.required(randNum), null)
    assertEquals(Validators.required(randStr), null)
    assertEquals(Validators.required(false), null)
    assertEquals(Validators.required(true), null)
  }
})

test({
  name: '[Validators.required] is invalid args',
  fn(): void {
    const failure = { required: { message: '"value" is required' } }

    assertEquals(Validators.required(undefined), failure)
    assertEquals(Validators.required(null), failure)
    assertEquals(Validators.required(''), failure)
  }
})

test({
  name: '[Validators.min] is valid args',
  fn(): void {
    const rand = generateRandomInt(11)
    const min = Validators.min(10)

    assertEquals(min(rand), null)
    assertEquals(min(11), null)
  }
})

test({
  name: '[Validators.min] is invalid args',
  fn(): void {
    const rand = generateRandomInt(undefined, 10)
    const min = Validators.min(10)

    assertEquals(min(rand), { min: { message: `"value" must be greater than 10`, reason: { min: 10, actual: rand } } })
    assertEquals(min(9), { min: { message: `"value" must be greater than 10`, reason: { min: 10, actual: 9 } } })
  }
})

test({
  name: '[Validators.max] is valid args',
  fn(): void {
    const rand = generateRandomInt(undefined, 10)
    const max = Validators.max(10)

    assertEquals(max(rand), null)
    assertEquals(max(9), null)
  }
})

test({
  name: '[Validators.max] is invalid args',
  fn(): void {
    const rand = generateRandomInt(11)
    const max = Validators.max(10)

    assertEquals(max(rand), { max: { message: `"value" must be less than 10`, reason: { max: 10, actual: rand } } })
    assertEquals(max(11), { max: { message: `"value" must be less than 10`, reason: { max: 10, actual: 11 } } })
  }
})

test({
  name: '[Validators.minLength] is valid args',
  fn(): void {
    const rand = generateRandomInt(11)
    const randStr = generateRandomString(rand)
    const minLength = Validators.minLength(10)

    assertEquals(minLength(randStr), null)
    assertEquals(minLength('12345678901'), null)
  }
})

test({
  name: '[Validators.minLength] is invalid args',
  fn(): void {
    const rand = generateRandomInt(1, 10)
    const randStr = generateRandomString(rand)
    const minLength = Validators.minLength(10)

    assertEquals(minLength(randStr), {
      minLength: {
        message: `"value" length must be at least 10 characters long`,
        reason: { requiredLength: 10, actualLength: randStr.length }
      }
    })
    assertEquals(minLength('123456789'), {
      minLength: {
        message: `"value" length must be at least 10 characters long`,
        reason: { requiredLength: 10, actualLength: 9 }
      }
    })
  }
})

test({
  name: '[Validators.maxLength] is valid args',
  fn(): void {
    const rand = generateRandomInt(1, 10)
    const randStr = generateRandomString(rand)
    const maxLength = Validators.maxLength(10)

    assertEquals(maxLength(randStr), null)
    assertEquals(maxLength('123456789'), null)
  }
})

test({
  name: '[Validators.maxLength] is invalid args',
  fn(): void {
    const rand = generateRandomInt(10)
    const randStr = generateRandomString(rand)
    const maxLength = Validators.maxLength(10)

    assertEquals(maxLength(randStr), {
      maxLength: {
        message: `"value" length must be less than 10 characters long`,
        reason: { requiredLength: 10, actualLength: randStr.length }
      }
    })
    assertEquals(maxLength('12345678901'), {
      maxLength: {
        message: `"value" length must be less than 10 characters long`,
        reason: { requiredLength: 10, actualLength: 11 }
      }
    })
  }
})

test({
  name: '[Validators.pattern] is valid args',
  fn(): void {
    const pattern = Validators.pattern(/^https:\/\/.+/)

    assertEquals(pattern('https://www.google.com'), null)
    assertEquals(pattern('https://github.com/search?q=deno'), null)
  }
})

test({
  name: '[Validators.pattern] is invalid args',
  fn(): void {
    const pattern = Validators.pattern(/^https:\/\/.+/)

    assertEquals(pattern('http://www.google.com'), {
      pattern: {
        message: '"value" fails to match the required pattern: /^https:\\/\\/.+/',
        reason: { requiredPattern: /^https:\/\/.+/, actualValue: 'http://www.google.com' }
      }
    })
    assertEquals(pattern('http://neverssl.com'), {
      pattern: {
        message: '"value" fails to match the required pattern: /^https:\\/\\/.+/',
        reason: { requiredPattern: /^https:\/\/.+/, actualValue: 'http://neverssl.com' }
      }
    })
  }
})

test({
  name: '[Combine Validator] is valid args',
  fn(): void {
    const rand = generateRandomInt(5, 10)
    const validators = [Validators.required, Validators.min(5), Validators.max(10)]

    assertEquals(validate(rand, validators), { errors: null, valid: true })
    assertEquals(validate(5, validators), { errors: null, valid: true })
    assertEquals(validate(9, validators), { errors: null, valid: true })
  }
})

test({
  name: '[Combine Validator] is invalid args',
  fn(): void {
    const less = generateRandomInt(undefined, 5)
    const more = generateRandomInt(11)
    const validators = [Validators.required, Validators.min(5), Validators.max(10)]

    assertEquals(validate(null, validators), { errors: { required: { message: '"value" is required' } }, valid: false })
    assertEquals(validate(less, validators), {
      errors: { min: { message: '"value" must be greater than 5', reason: { min: 5, actual: less } } },
      valid: false
    })
    assertEquals(validate(more, validators), {
      errors: { max: { message: '"value" must be less than 10', reason: { max: 10, actual: more } } },
      valid: false
    })
    assertEquals(validate(4, validators), {
      errors: { min: { message: '"value" must be greater than 5', reason: { min: 5, actual: 4 } } },
      valid: false
    })
    assertEquals(validate(11, validators), {
      errors: { max: { message: '"value" must be less than 10', reason: { max: 10, actual: 11 } } },
      valid: false
    })
  }
})

runTests()
