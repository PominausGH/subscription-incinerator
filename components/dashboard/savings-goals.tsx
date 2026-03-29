'use client'

import { useState, useEffect } from 'react'
import { Target, Plus, Trash2 } from 'lucide-react'

type SavingsGoal = {
  id: string
  name: string
  targetAmount: string
  currency: string
  deadline: string | null
}

type Props = {
  totalSaved: number
  currency: string
}

export function SavingsGoals({ totalSaved, currency }: Props) {
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')

  useEffect(() => {
    fetch('/api/savings-goals')
      .then((r) => r.json())
      .then(setGoals)
  }, [])

  async function addGoal(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/savings-goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, targetAmount: parseFloat(target), currency }),
    })
    if (res.ok) {
      const goal = await res.json()
      setGoals((prev) => [goal, ...prev])
      setName('')
      setTarget('')
      setShowForm(false)
    }
  }

  async function deleteGoal(id: string) {
    await fetch(`/api/savings-goals/${id}`, { method: 'DELETE' })
    setGoals((prev) => prev.filter((g) => g.id !== id))
  }

  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-green-400" />
          <h3 className="text-sm font-medium text-gray-300">Savings Goals</h3>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Add Goal
        </button>
      </div>

      <div className="mb-4 p-3 bg-green-900/20 rounded-lg border border-green-800/30">
        <p className="text-xs text-gray-400">Total saved by cancelling</p>
        <p className="text-2xl font-bold text-green-400">
          {currency} {totalSaved.toFixed(2)}
          <span className="text-xs text-gray-500 font-normal ml-1">/yr</span>
        </p>
      </div>

      {showForm && (
        <form onSubmit={addGoal} className="mb-4 space-y-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Goal name (e.g. Holiday Fund)"
            className="w-full bg-gray-800 text-sm rounded-lg px-3 py-2 text-white border border-gray-700"
            required
          />
          <input
            type="number"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="Target amount"
            className="w-full bg-gray-800 text-sm rounded-lg px-3 py-2 text-white border border-gray-700"
            min="1"
            required
          />
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg py-2"
          >
            Save Goal
          </button>
        </form>
      )}

      <div className="space-y-3">
        {goals.map((goal) => {
          const targetAmt = parseFloat(goal.targetAmount)
          const progress = Math.min((totalSaved / targetAmt) * 100, 100)
          return (
            <div key={goal.id}>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{goal.name}</span>
                <div className="flex items-center gap-2">
                  <span>{currency} {totalSaved.toFixed(0)} / {targetAmt.toFixed(0)}</span>
                  <button onClick={() => deleteGoal(goal.id)}>
                    <Trash2 className="w-3 h-3 text-gray-600 hover:text-red-400" />
                  </button>
                </div>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )
        })}
        {goals.length === 0 && !showForm && (
          <p className="text-xs text-gray-600 text-center py-2">
            No goals yet — add one to track progress
          </p>
        )}
      </div>
    </div>
  )
}
