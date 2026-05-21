import { describe, it, expect } from 'vitest'
import { detectSentinel, autoGrade } from './sentinel'
import type { SymptomData } from '@features/reports/types'

describe('Sentinel Logic (Dietary Exclusion)', () => {
  it('should return green even if waterIntake is high', () => {
    const symptoms: SymptomData = {
      waterIntake: 8,
      foodIntake: 5,
      nausea: 0,
      vomiting: 0,
      diarrhea: 0,
      fatigue: 0,
      pain: 0,
      mucositis: 0,
      neuropathy: 0,
      skinReaction: 0,
      appetiteLoss: 0,
      fever: 0,
      dyspnea: 0
    }
    
    expect(detectSentinel(symptoms)).toBe(false)
    expect(autoGrade(symptoms)).toBe('green')
  })

  it('should detect sentinel when clinical symptoms are high', () => {
    const symptoms: SymptomData = {
      waterIntake: 8,
      nausea: 3, // Grade 3
      vomiting: 0
    }
    
    expect(detectSentinel(symptoms)).toBe(true)
    expect(autoGrade(symptoms)).toBe('red')
  })

  it('should detect sentinel for fever regardless of water intake', () => {
    const symptoms: SymptomData = {
      waterIntake: 8,
      fever: 1
    }
    
    expect(detectSentinel(symptoms)).toBe(true)
    expect(autoGrade(symptoms)).toBe('red')
  })

  it('should grade yellow for moderate clinical symptoms', () => {
    const symptoms: SymptomData = {
      waterIntake: 8,
      foodIntake: 1, // dietary should be ignored
      nausea: 2 // Grade 2 clinical
    }
    
    expect(detectSentinel(symptoms)).toBe(false)
    expect(autoGrade(symptoms)).toBe('yellow')
  })

  it('should stay green if all clinical symptoms are 0', () => {
    const symptoms: SymptomData = {
      waterIntake: 10,
      foodIntake: 5,
      nausea: 0,
      fatigue: 0
    }
    
    expect(autoGrade(symptoms)).toBe('green')
  })

  it('should detect sentinel when new symptoms (constipation, insomnia, alopecia) have high grade', () => {
    const symptomsHighConstipation: SymptomData = {
      constipation: 3 // Grade 3 constipation -> sentinel
    }
    expect(detectSentinel(symptomsHighConstipation)).toBe(true)
    expect(autoGrade(symptomsHighConstipation)).toBe('red')

    const symptomsHighInsomnia: SymptomData = {
      insomnia: 3
    }
    expect(detectSentinel(symptomsHighInsomnia)).toBe(true)
    expect(autoGrade(symptomsHighInsomnia)).toBe('red')

    const symptomsHighAlopecia: SymptomData = {
      alopecia: 3
    }
    expect(detectSentinel(symptomsHighAlopecia)).toBe(true)
    expect(autoGrade(symptomsHighAlopecia)).toBe('red')
  })

  it('should grade yellow for moderate new symptoms', () => {
    const symptomsModerate: SymptomData = {
      constipation: 2,
      insomnia: 1
    }
    expect(detectSentinel(symptomsModerate)).toBe(false)
    expect(autoGrade(symptomsModerate)).toBe('yellow')
  })
})

