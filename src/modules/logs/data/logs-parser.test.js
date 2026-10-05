import { describe, it, expect } from 'vitest'
import { processLogText, mergeLogs, extractInfos } from './logs-parser.js'

const LINE = "2026-10-01 12:00:00,123 - ERROR - Upload failed for recording 42 (file: LL.Q21_(fra)_Yug-bonjour.wav): {'code': 'badtoken', 'info': 'Invalid token'}"

describe('logs-parser', () => {
  it('parses a log line', () => {
    expect(extractInfos(LINE)).toMatchObject({ type: 'ERROR', recording: 42 })
    const [row] = processLogText(LINE + '\n')
    expect(row).toMatchObject({ timestamp: '2026-10-01', iso_639: 'fra', qid: 'Q21', details: { code: 'badtoken' } })
  })
  it('skips blank and unparsable lines', () => {
    expect(processLogText('\nnot a log\n')).toEqual([])
  })
  it('merges without duplicating identical lines', () => {
    expect(mergeLogs(LINE + '\n', LINE + '\n').added).toBe(0)
  })
})
