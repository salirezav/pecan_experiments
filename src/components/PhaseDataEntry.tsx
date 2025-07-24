import { useState, useEffect, useCallback } from 'react'
import { dataEntryManagement, type Experiment, type ExperimentDataEntry, type ExperimentPhase, type ExperimentPhaseData } from '../lib/supabase'

interface PhaseDataEntryProps {
  experiment: Experiment
  dataEntry: ExperimentDataEntry
  phase: ExperimentPhase
  onBack: () => void
  onDataSaved: () => void
}

export function PhaseDataEntry({ experiment, dataEntry, phase, onBack, onDataSaved }: PhaseDataEntryProps) {
  const [phaseData, setPhaseData] = useState<Partial<ExperimentPhaseData>>({})
  const [diameterMeasurements, setDiameterMeasurements] = useState<number[]>(Array(10).fill(0))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Auto-save interval (30 seconds)
  const AUTO_SAVE_INTERVAL = 30000

  const loadPhaseData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const existingData = await dataEntryManagement.getPhaseData(dataEntry.id, phase)

      if (existingData) {
        setPhaseData(existingData)

        // Load diameter measurements if they exist
        if (existingData.diameter_measurements) {
          const measurements = Array(10).fill(0)
          existingData.diameter_measurements.forEach(measurement => {
            if (measurement.measurement_number >= 1 && measurement.measurement_number <= 10) {
              measurements[measurement.measurement_number - 1] = measurement.diameter_in
            }
          })
          setDiameterMeasurements(measurements)
        }
      } else {
        // Initialize empty phase data
        setPhaseData({
          data_entry_id: dataEntry.id,
          phase_name: phase
        })
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load phase data'
      setError(errorMessage)
      console.error('Load phase data error:', err)
    } finally {
      setLoading(false)
    }
  }, [dataEntry.id, phase])

  const autoSave = useCallback(async () => {
    if (dataEntry.status === 'submitted') return // Don't auto-save submitted entries

    try {
      await dataEntryManagement.autoSaveDraft(dataEntry.id, phase, phaseData)

      // Save diameter measurements if this is air-drying phase and we have measurements
      if (phase === 'air-drying' && phaseData.id && diameterMeasurements.some(m => m > 0)) {
        const validMeasurements = diameterMeasurements.filter(m => m > 0)
        if (validMeasurements.length > 0) {
          await dataEntryManagement.saveDiameterMeasurements(phaseData.id, diameterMeasurements)

          // Update average diameter
          const avgDiameter = dataEntryManagement.calculateAverageDiameter(validMeasurements)
          setPhaseData(prev => ({ ...prev, avg_pecan_diameter_in: avgDiameter }))
        }
      }

      setLastSaved(new Date())
    } catch (error) {
      console.warn('Auto-save failed:', error)
    }
  }, [dataEntry.id, dataEntry.status, phase, phaseData, diameterMeasurements])

  useEffect(() => {
    loadPhaseData()
  }, [loadPhaseData])

  // Auto-save effect
  useEffect(() => {
    if (!loading && phaseData.id) {
      const interval = setInterval(() => {
        autoSave()
      }, AUTO_SAVE_INTERVAL)

      return () => clearInterval(interval)
    }
  }, [phaseData, diameterMeasurements, loading, autoSave])

  const handleInputChange = (field: string, value: unknown) => {
    setPhaseData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleDiameterChange = (index: number, value: number) => {
    const newMeasurements = [...diameterMeasurements]
    newMeasurements[index] = value
    setDiameterMeasurements(newMeasurements)

    // Calculate and update average
    const validMeasurements = newMeasurements.filter(m => m > 0)
    if (validMeasurements.length > 0) {
      const avgDiameter = dataEntryManagement.calculateAverageDiameter(validMeasurements)
      handleInputChange('avg_pecan_diameter_in', avgDiameter)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      // Save phase data
      const savedData = await dataEntryManagement.upsertPhaseData(dataEntry.id, phase, phaseData)
      setPhaseData(savedData)

      // Save diameter measurements if this is air-drying phase
      if (phase === 'air-drying' && diameterMeasurements.some(m => m > 0)) {
        await dataEntryManagement.saveDiameterMeasurements(savedData.id, diameterMeasurements)
      }

      setLastSaved(new Date())
      onDataSaved()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save data'
      setError(errorMessage)
      console.error('Save error:', err)
    } finally {
      setSaving(false)
    }
  }

  const getPhaseTitle = () => {
    switch (phase) {
      case 'pre-soaking': return 'Pre-Soaking Phase'
      case 'air-drying': return 'Air-Drying Phase'
      case 'cracking': return 'Cracking Phase'
      case 'shelling': return 'Shelling Phase'
      default: return 'Unknown Phase'
    }
  }

  const calculateSoakingEndTime = () => {
    if (phaseData.soaking_start_time && experiment.soaking_duration_hr) {
      const startTime = new Date(phaseData.soaking_start_time)
      const endTime = new Date(startTime.getTime() + experiment.soaking_duration_hr * 60 * 60 * 1000)
      return endTime.toISOString().slice(0, 16) // Format for datetime-local input
    }
    return ''
  }

  const calculateAirDryingEndTime = () => {
    if (phaseData.airdrying_start_time && experiment.air_drying_time_min) {
      const startTime = new Date(phaseData.airdrying_start_time)
      const endTime = new Date(startTime.getTime() + experiment.air_drying_time_min * 60 * 1000)
      return endTime.toISOString().slice(0, 16) // Format for datetime-local input
    }
    return ''
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading phase data...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-2"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Phases
            </button>
            <h2 className="text-2xl font-bold text-gray-900">{getPhaseTitle()}</h2>
          </div>
          <div className="flex items-center space-x-4">
            {lastSaved && (
              <span className="text-sm text-gray-500">
                Last saved: {lastSaved.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving || dataEntry.status === 'submitted'}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {dataEntry.status === 'submitted' && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="text-sm text-yellow-700">
              This entry has been submitted and is read-only. Create a new draft to make changes.
            </div>
          </div>
        )}
      </div>

      {/* Phase-specific forms */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {phase === 'pre-soaking' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Pre-Soaking Measurements</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch Initial Weight (lbs) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={phaseData.batch_initial_weight_lbs || ''}
                  onChange={(e) => handleInputChange('batch_initial_weight_lbs', parseFloat(e.target.value) || null)}
                  className="max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  disabled={dataEntry.status === 'submitted'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Initial Shell Moisture (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={phaseData.initial_shell_moisture_pct || ''}
                  onChange={(e) => handleInputChange('initial_shell_moisture_pct', parseFloat(e.target.value) || null)}
                  className="max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.0"
                  disabled={dataEntry.status === 'submitted'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Initial Kernel Moisture (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={phaseData.initial_kernel_moisture_pct || ''}
                  onChange={(e) => handleInputChange('initial_kernel_moisture_pct', parseFloat(e.target.value) || null)}
                  className="max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.0"
                  disabled={dataEntry.status === 'submitted'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Soaking Start Time *
                </label>
                <input
                  type="datetime-local"
                  value={phaseData.soaking_start_time ? new Date(phaseData.soaking_start_time).toISOString().slice(0, 16) : ''}
                  onChange={(e) => handleInputChange('soaking_start_time', e.target.value ? new Date(e.target.value).toISOString() : null)}
                  className="max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={dataEntry.status === 'submitted'}
                />
              </div>
            </div>

            {/* Calculated Soaking End Time */}
            {phaseData.soaking_start_time && (
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Soaking End Time (Calculated)
                </label>
                <input
                  type="datetime-local"
                  value={calculateSoakingEndTime()}
                  className="max-w-xs px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  disabled
                />
                <p className="mt-1 text-xs text-gray-500">
                  Automatically calculated based on soaking duration ({experiment.soaking_duration_hr}h)
                </p>
              </div>
            )}
          </div>
        )}

        {phase === 'air-drying' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Air-Drying Measurements</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Air-Drying Start Time *
                </label>
                <input
                  type="datetime-local"
                  value={phaseData.airdrying_start_time ? new Date(phaseData.airdrying_start_time).toISOString().slice(0, 16) : ''}
                  onChange={(e) => handleInputChange('airdrying_start_time', e.target.value ? new Date(e.target.value).toISOString() : null)}
                  className="max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={dataEntry.status === 'submitted'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Post-Soak Weight (lbs)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={phaseData.post_soak_weight_lbs || ''}
                  onChange={(e) => handleInputChange('post_soak_weight_lbs', parseFloat(e.target.value) || null)}
                  className="max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  disabled={dataEntry.status === 'submitted'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Post-Soak Kernel Moisture (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={phaseData.post_soak_kernel_moisture_pct || ''}
                  onChange={(e) => handleInputChange('post_soak_kernel_moisture_pct', parseFloat(e.target.value) || null)}
                  className="max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.0"
                  disabled={dataEntry.status === 'submitted'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Post-Soak Shell Moisture (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={phaseData.post_soak_shell_moisture_pct || ''}
                  onChange={(e) => handleInputChange('post_soak_shell_moisture_pct', parseFloat(e.target.value) || null)}
                  className="max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.0"
                  disabled={dataEntry.status === 'submitted'}
                />
              </div>
            </div>

            {/* Calculated Air-Drying End Time */}
            {phaseData.airdrying_start_time && (
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Air-Drying End Time (Calculated)
                </label>
                <input
                  type="datetime-local"
                  value={calculateAirDryingEndTime()}
                  className="max-w-xs px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  disabled
                />
                <p className="mt-1 text-xs text-gray-500">
                  Automatically calculated based on air-drying duration ({experiment.air_drying_time_min} minutes)
                </p>
              </div>
            )}

            {/* Pecan Diameter Measurements */}
            <div className="border-t pt-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">Pecan Diameter Measurements (inches)</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {diameterMeasurements.map((measurement, index) => (
                  <div key={index}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Measurement {index + 1}
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={measurement || ''}
                      onChange={(e) => handleDiameterChange(index, parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.000"
                      disabled={dataEntry.status === 'submitted'}
                    />
                  </div>
                ))}
              </div>

              {/* Average Diameter Display */}
              <div className="mt-4 bg-blue-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Average Pecan Diameter (Calculated)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={phaseData.avg_pecan_diameter_in || ''}
                  onChange={(e) => handleInputChange('avg_pecan_diameter_in', parseFloat(e.target.value) || null)}
                  className="max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.000"
                  disabled={dataEntry.status === 'submitted'}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Automatically calculated from individual measurements above
                </p>
              </div>
            </div>
          </div>
        )}

        {phase === 'cracking' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cracking Phase</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cracking Start Time *
                </label>
                <input
                  type="datetime-local"
                  value={phaseData.cracking_start_time ? new Date(phaseData.cracking_start_time).toISOString().slice(0, 16) : ''}
                  onChange={(e) => handleInputChange('cracking_start_time', e.target.value ? new Date(e.target.value).toISOString() : null)}
                  className="max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={dataEntry.status === 'submitted'}
                />
              </div>
            </div>

            {/* Machine Parameters Display */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-md font-medium text-gray-700 mb-3">Cracker Machine Parameters (Read-Only)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plate Contact Frequency (Hz)
                  </label>
                  <input
                    type="number"
                    value={experiment.plate_contact_frequency_hz}
                    className="max-w-xs px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Throughput Rate (pecans/sec)
                  </label>
                  <input
                    type="number"
                    value={experiment.throughput_rate_pecans_sec}
                    className="max-w-xs px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Crush Amount (inches)
                  </label>
                  <input
                    type="number"
                    value={experiment.crush_amount_in}
                    className="max-w-xs px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Entry/Exit Height Difference (inches)
                  </label>
                  <input
                    type="number"
                    value={experiment.entry_exit_height_diff_in}
                    className="max-w-xs px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    disabled
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {phase === 'shelling' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Shelling Phase</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shelling Start Time *
                </label>
                <input
                  type="datetime-local"
                  value={phaseData.shelling_start_time ? new Date(phaseData.shelling_start_time).toISOString().slice(0, 16) : ''}
                  onChange={(e) => handleInputChange('shelling_start_time', e.target.value ? new Date(e.target.value).toISOString() : null)}
                  className="max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={dataEntry.status === 'submitted'}
                />
              </div>
            </div>

            {/* Bin Weights */}
            <div className="border-t pt-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">Bin Weights (lbs)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bin 1 Weight
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={phaseData.bin_1_weight_lbs || ''}
                    onChange={(e) => handleInputChange('bin_1_weight_lbs', parseFloat(e.target.value) || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                    disabled={dataEntry.status === 'submitted'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bin 2 Weight
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={phaseData.bin_2_weight_lbs || ''}
                    onChange={(e) => handleInputChange('bin_2_weight_lbs', parseFloat(e.target.value) || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                    disabled={dataEntry.status === 'submitted'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bin 3 Weight
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={phaseData.bin_3_weight_lbs || ''}
                    onChange={(e) => handleInputChange('bin_3_weight_lbs', parseFloat(e.target.value) || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                    disabled={dataEntry.status === 'submitted'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discharge Bin Weight
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={phaseData.discharge_bin_weight_lbs || ''}
                    onChange={(e) => handleInputChange('discharge_bin_weight_lbs', parseFloat(e.target.value) || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                    disabled={dataEntry.status === 'submitted'}
                  />
                </div>
              </div>
            </div>

            {/* Full Yield Weights */}
            <div className="border-t pt-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">Full Yield Weights (oz)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bin 1 Full Yield
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={phaseData.bin_1_full_yield_oz || ''}
                    onChange={(e) => handleInputChange('bin_1_full_yield_oz', parseFloat(e.target.value) || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                    disabled={dataEntry.status === 'submitted'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bin 2 Full Yield
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={phaseData.bin_2_full_yield_oz || ''}
                    onChange={(e) => handleInputChange('bin_2_full_yield_oz', parseFloat(e.target.value) || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                    disabled={dataEntry.status === 'submitted'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bin 3 Full Yield
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={phaseData.bin_3_full_yield_oz || ''}
                    onChange={(e) => handleInputChange('bin_3_full_yield_oz', parseFloat(e.target.value) || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                    disabled={dataEntry.status === 'submitted'}
                  />
                </div>
              </div>
            </div>

            {/* Half Yield Weights */}
            <div className="border-t pt-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">Half Yield Weights (oz)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bin 1 Half Yield
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={phaseData.bin_1_half_yield_oz || ''}
                    onChange={(e) => handleInputChange('bin_1_half_yield_oz', parseFloat(e.target.value) || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                    disabled={dataEntry.status === 'submitted'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bin 2 Half Yield
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={phaseData.bin_2_half_yield_oz || ''}
                    onChange={(e) => handleInputChange('bin_2_half_yield_oz', parseFloat(e.target.value) || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                    disabled={dataEntry.status === 'submitted'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bin 3 Half Yield
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={phaseData.bin_3_half_yield_oz || ''}
                    onChange={(e) => handleInputChange('bin_3_half_yield_oz', parseFloat(e.target.value) || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                    disabled={dataEntry.status === 'submitted'}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
