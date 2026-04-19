'use client'

import { useState } from 'react'
import type { Account } from '@/types'

interface Props {
  initial: Partial<Account>
  userId: string
  onSave: (account: Account) => void
  onClose: () => void
}

export function AccountsSetupModal({ initial, userId, onSave, onClose }: Props) {
  const [creditScore, setCreditScore] = useState<number>(initial.creditScore ?? 720)
  const [creditLimit, setCreditLimit] = useState<number>(initial.creditLimit ?? 8000)
  const [currentBalance, setCurrentBalance] = useState<number>(initial.currentBalance ?? 1400)
  const [monthlyPaymentPct, setMonthlyPaymentPct] = useState<number>(initial.monthlyPaymentPct ?? 3)
  const [savings, setSavings] = useState<number>(initial.savings ?? 6800)
  const [debt, setDebt] = useState<number>(initial.debt ?? 2400)

  function save() {
    onSave({
      userId,
      creditScore,
      creditLimit,
      currentBalance,
      monthlyPaymentPct,
      savings,
      debt,
      configuredAt: Date.now(),
    })
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(28, 26, 46, 0.55)' }}
      onClick={onClose}
    >
      <div
        className="surface-card p-6 w-full max-w-lg flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <div className="label">Set up tracking</div>
          <h2 className="font-lora" style={{ fontSize: 22, color: 'var(--text-primary)' }}>
            Where does your money sit?
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Stored locally in your browser. Nothing leaves your device.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Credit score"
            value={creditScore}
            onChange={setCreditScore}
            min={300} max={850} step={1}
            slider
          />
          <Field
            label="Credit limit ($)"
            value={creditLimit}
            onChange={setCreditLimit}
            min={0} max={100000} step={500}
          />
          <Field
            label="Current balance on card ($)"
            value={currentBalance}
            onChange={setCurrentBalance}
            min={0} max={creditLimit || 100000} step={10}
          />
          <Field
            label="Monthly payment (%)"
            value={monthlyPaymentPct}
            onChange={setMonthlyPaymentPct}
            min={0} max={100} step={1}
          />
          <Field
            label="Savings ($)"
            value={savings}
            onChange={setSavings}
            min={0} max={500000} step={100}
          />
          <Field
            label="Other debt ($)"
            value={debt}
            onChange={setDebt}
            min={0} max={500000} step={100}
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="btn-ghost"
          >
            Cancel
          </button>
          <button onClick={save} className="btn-primary">
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({
  label, value, onChange, min, max, step, slider,
}: {
  label: string
  value: number
  onChange: (n: number) => void
  min: number
  max: number
  step: number
  slider?: boolean
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="field w-full"
        />
      </div>
      {slider && (
        <input
          type="range"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: 'var(--accent-primary)' }}
        />
      )}
    </label>
  )
}
