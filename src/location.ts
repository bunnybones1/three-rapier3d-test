import { clamp } from './math'

export function getUrlParam(param: string) {
  return new URL(window.location.href).searchParams.get(param)
}

export function getUrlFlag(param: string) {
  const result = getUrlParam(param)
  return !!(result === '' || (result && result !== 'false'))
}

function __getUrlNumber(
  param: string,
  defaultVal: number,
  parser: (val: string) => number,
  min = -Infinity,
  max = Infinity
) {
  return clamp(parser(getUrlParam(param) || defaultVal.toString()), min, max)
}

export function getUrlFloat(
  param: string,
  defaultVal: number,
  min = -Infinity,
  max = Infinity
) {
  return __getUrlNumber(param, defaultVal, parseFloat, min, max)
}

export function getUrlInt(
  param: string,
  defaultVal: number,
  min = -Infinity,
  max = Infinity
) {
  return __getUrlNumber(param, defaultVal, parseInt, min, max)
}

export function queryStringUrlReplacement(
  url: string,
  changes: { [key: string]: string }
): string
export function queryStringUrlReplacement(
  url: string,
  param: string,
  value: string
): string
export function queryStringUrlReplacement(
  url: string,
  paramOrChanges: string | { [key: string]: string },
  value?: string
): string {
  let newString: string = url
  const changes =
    typeof paramOrChanges === 'string'
      ? { [paramOrChanges]: `${value}` }
      : paramOrChanges
  for (const param of Object.keys(changes)) {
    const re = new RegExp('[\\?&]' + param + '=([^&#]*)')
    const match = re.exec(newString)
    let delimiter: string

    if (match === null) {
      // append new param
      const hasQuestionMark = /\?/.test(newString)
      delimiter = hasQuestionMark ? '&' : '?'
      newString = newString + delimiter + param + '=' + changes[param]
    } else {
      delimiter = match[0].charAt(0)
      newString = newString.replace(
        re,
        delimiter + param + '=' + changes[param]
      )
    }
  }

  return newString
}