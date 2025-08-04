import { useState, useEffect } from 'react'
import { visionApi, type CameraConfig, type CameraConfigUpdate } from '../lib/visionApi'


interface CameraConfigModalProps {
  cameraName: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: (message: string) => void
  onError?: (error: string) => void
}

export function CameraConfigModal({ cameraName, isOpen, onClose, onSuccess, onError }: CameraConfigModalProps) {
  const [config, setConfig] = useState<CameraConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [originalConfig, setOriginalConfig] = useState<CameraConfig | null>(null)

  useEffect(() => {
    if (isOpen && cameraName) {
      loadConfig()
    }
  }, [isOpen, cameraName])

  const loadConfig = async () => {
    try {
      setLoading(true)
      setError(null)
      const configData = await visionApi.getCameraConfig(cameraName)

      // The API should now include all fields including video format settings
      const configWithDefaults = configData

      setConfig(configWithDefaults)
      setOriginalConfig(configWithDefaults)
      setHasChanges(false)
    } catch (err) {
      let errorMessage = 'Failed to load camera configuration'

      if (err instanceof Error) {
        errorMessage = err.message

        // Handle specific API validation errors for missing video format fields
        if (err.message.includes('video_format') || err.message.includes('video_codec') || err.message.includes('video_quality')) {
          errorMessage = 'Camera configuration is missing video format settings. This may indicate the backend needs to be updated to support MP4 format. Using default values.'

          // Create a default configuration for display
          const defaultConfig = {
            name: cameraName,
            machine_topic: '',
            storage_path: '',
            enabled: true,
            auto_record_on_machine_start: false,
            auto_start_recording_enabled: false,
            auto_recording_max_retries: 3,
            auto_recording_retry_delay_seconds: 2,
            exposure_ms: 1.0,
            gain: 3.5,
            target_fps: 0,
            video_format: 'mp4',
            video_codec: 'mp4v',
            video_quality: 95,
            sharpness: 120,
            contrast: 110,
            saturation: 100,
            gamma: 100,
            noise_filter_enabled: true,
            denoise_3d_enabled: false,
            auto_white_balance: true,
            color_temperature_preset: 0,
            anti_flicker_enabled: true,
            light_frequency: 1,
            bit_depth: 8,
            hdr_enabled: false,
            hdr_gain_mode: 0,
          }

          setConfig(defaultConfig)
          setOriginalConfig(defaultConfig)
          setHasChanges(false)
          setError(errorMessage)
          return
        }
      }

      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = (key: keyof CameraConfigUpdate, value: number | boolean | string) => {
    if (!config) return

    const newConfig = { ...config, [key]: value }
    setConfig(newConfig)

    // Check if there are changes from original
    const hasChanges = originalConfig && Object.keys(newConfig).some(k => {
      const configKey = k as keyof CameraConfig
      return newConfig[configKey] !== originalConfig[configKey]
    })
    setHasChanges(!!hasChanges)

    // Video format settings are read-only, no validation needed
  }

  const saveConfig = async () => {
    if (!config || !originalConfig) return

    try {
      setSaving(true)
      setError(null)

      // Build update object with only changed values
      const updates: CameraConfigUpdate = {}
      const configKeys: (keyof CameraConfigUpdate)[] = [
        'exposure_ms', 'gain', 'target_fps', 'sharpness', 'contrast', 'saturation',
        'gamma', 'noise_filter_enabled', 'denoise_3d_enabled', 'auto_white_balance',
        'color_temperature_preset', 'anti_flicker_enabled', 'light_frequency',
        'hdr_enabled', 'hdr_gain_mode', 'auto_record_on_machine_start',
        'auto_start_recording_enabled', 'auto_recording_max_retries', 'auto_recording_retry_delay_seconds'
      ]

      configKeys.forEach(key => {
        if (config[key] !== originalConfig[key]) {
          updates[key] = config[key] as any
        }
      })

      if (Object.keys(updates).length === 0) {
        onSuccess?.('No changes to save')
        return
      }

      const result = await visionApi.updateCameraConfig(cameraName, updates)

      if (result.success) {
        setOriginalConfig(config)
        setHasChanges(false)
        onSuccess?.(`Configuration updated: ${result.updated_settings.join(', ')}`)
      } else {
        throw new Error(result.message)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save configuration'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setSaving(false)
    }
  }



  const resetChanges = () => {
    if (originalConfig) {
      setConfig(originalConfig)
      setHasChanges(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Camera Configuration - {cameraName}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-2 text-gray-600">Loading configuration...</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Configuration Error</h3>
                  <p className="mt-2 text-sm text-red-700">{error}</p>
                  {error.includes('video_format') && (
                    <p className="mt-2 text-sm text-red-600">
                      <strong>Note:</strong> The video format settings are displayed with default values.
                      You can still modify and save the configuration, but the backend may need to be updated
                      to fully support MP4 format settings.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {config && !loading && (
            <div className="space-y-6">
              {/* System Information (Read-Only) */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">System Information</h4>
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Camera Name</label>
                      <div className="text-sm text-gray-900 font-medium">{config.name}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Machine Topic</label>
                      <div className="text-sm text-gray-900 font-medium">{config.machine_topic}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Storage Path</label>
                      <div className="text-sm text-gray-900 font-medium">{config.storage_path}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <div className="text-sm text-gray-900 font-medium">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                          {config.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Auto-Recording Settings (Read-Only) */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Auto-Recording Settings</h4>
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Auto Recording</label>
                      <div className="text-sm text-gray-900 font-medium">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.auto_start_recording_enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                          {config.auto_start_recording_enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Retries</label>
                      <div className="text-sm text-gray-900 font-medium">{config.auto_recording_max_retries}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Retry Delay</label>
                      <div className="text-sm text-gray-900 font-medium">{config.auto_recording_retry_delay_seconds}s</div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">Auto-recording settings are configured in the system configuration file</p>
                </div>
              </div>

              {/* Basic Settings */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Basic Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Exposure (ms): {config.exposure_ms}
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="10"
                      step="0.1"
                      value={config.exposure_ms}
                      onChange={(e) => updateSetting('exposure_ms', parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0.1ms</span>
                      <span>10ms</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gain: {config.gain}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.1"
                      value={config.gain}
                      onChange={(e) => updateSetting('gain', parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0</span>
                      <span>10</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target FPS: {config.target_fps} {config.target_fps === 0 ? '(Maximum)' : ''}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      step="1"
                      value={config.target_fps}
                      onChange={(e) => updateSetting('target_fps', parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0 (Max)</span>
                      <span>30</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Image Quality Settings */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Image Quality</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sharpness: {config.sharpness}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={config.sharpness}
                      onChange={(e) => updateSetting('sharpness', parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0</span>
                      <span>200</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contrast: {config.contrast}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={config.contrast}
                      onChange={(e) => updateSetting('contrast', parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0</span>
                      <span>200</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Saturation: {config.saturation}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={config.saturation}
                      onChange={(e) => updateSetting('saturation', parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0</span>
                      <span>200</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gamma: {config.gamma}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="300"
                      value={config.gamma}
                      onChange={(e) => updateSetting('gamma', parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0</span>
                      <span>300</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Color Settings */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Color Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={config.auto_white_balance}
                        onChange={(e) => updateSetting('auto_white_balance', e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Auto White Balance</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color Temperature Preset: {config.color_temperature_preset} {config.color_temperature_preset === 0 ? '(Auto)' : ''}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={config.color_temperature_preset}
                      onChange={(e) => updateSetting('color_temperature_preset', parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0 (Auto)</span>
                      <span>10</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* White Balance RGB Gains */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">White Balance RGB Gains</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Red Gain: {config.wb_red_gain?.toFixed(2) || '1.00'}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="3.99"
                      step="0.01"
                      value={config.wb_red_gain || 1.0}
                      onChange={(e) => updateSetting('wb_red_gain', parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0.00</span>
                      <span>3.99</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Green Gain: {config.wb_green_gain?.toFixed(2) || '1.00'}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="3.99"
                      step="0.01"
                      value={config.wb_green_gain || 1.0}
                      onChange={(e) => updateSetting('wb_green_gain', parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0.00</span>
                      <span>3.99</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Blue Gain: {config.wb_blue_gain?.toFixed(2) || '1.00'}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="3.99"
                      step="0.01"
                      value={config.wb_blue_gain || 1.0}
                      onChange={(e) => updateSetting('wb_blue_gain', parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0.00</span>
                      <span>3.99</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Manual white balance gains (only effective when Auto White Balance is disabled)</p>
              </div>

              {/* Advanced Settings */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Advanced Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={config.anti_flicker_enabled}
                        onChange={(e) => updateSetting('anti_flicker_enabled', e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Anti-flicker Enabled</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Light Frequency: {config.light_frequency === 0 ? '50Hz' : '60Hz'}
                    </label>
                    <select
                      value={config.light_frequency}
                      onChange={(e) => updateSetting('light_frequency', parseInt(e.target.value))}
                      className="w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value={0}>50Hz</option>
                      <option value={1}>60Hz</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={config.noise_filter_enabled}
                        onChange={(e) => updateSetting('noise_filter_enabled', e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Noise Filter Enabled</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">Requires restart to apply</p>
                  </div>

                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={config.denoise_3d_enabled}
                        onChange={(e) => updateSetting('denoise_3d_enabled', e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-gray-700">3D Denoise Enabled</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">Requires restart to apply</p>
                  </div>
                </div>
              </div>

              {/* HDR Settings */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">HDR Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={config.hdr_enabled}
                        onChange={(e) => updateSetting('hdr_enabled', e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-gray-700">HDR Enabled</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      HDR Gain Mode: {config.hdr_gain_mode}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="3"
                      value={config.hdr_gain_mode}
                      onChange={(e) => updateSetting('hdr_gain_mode', parseInt(e.target.value))}
                      className="w-full"
                      disabled={!config.hdr_enabled}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0</span>
                      <span>3</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Video Recording Settings (Read-Only) */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Video Recording Settings</h4>
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Video Format
                      </label>
                      <div className="text-sm text-gray-900 font-medium">
                        {config.video_format?.toUpperCase() || 'MP4'}
                      </div>
                      <p className="text-xs text-gray-500">Current recording format</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Video Codec
                      </label>
                      <div className="text-sm text-gray-900 font-medium">
                        {config.video_codec?.toUpperCase() || 'MP4V'}
                      </div>
                      <p className="text-xs text-gray-500">Compression codec</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Video Quality
                      </label>
                      <div className="text-sm text-gray-900 font-medium">
                        {config.video_quality || 95}%
                      </div>
                      <p className="text-xs text-gray-500">Recording quality</p>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">Video Format Information</h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <p>Video recording settings are configured in the system configuration file and require a service restart to modify.</p>
                          <p className="mt-1"><strong>Current benefits:</strong> MP4 format provides ~40% smaller file sizes and better web compatibility than AVI.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>



              {/* Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Configuration Notes</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <ul className="list-disc list-inside space-y-1">
                        <li><strong>Real-time settings:</strong> Exposure, gain, image quality, white balance - apply immediately</li>
                        <li><strong>System settings:</strong> Video format, noise reduction, auto-recording - configured in system files</li>
                        <li><strong>Performance:</strong> HDR mode may impact frame rate when enabled</li>
                        <li><strong>White balance:</strong> RGB gains only effective when auto white balance is disabled</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {config && !loading && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {hasChanges && (
                  <span className="text-sm text-orange-600 font-medium">
                    You have unsaved changes
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-3">
                {hasChanges && (
                  <button
                    onClick={resetChanges}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Reset
                  </button>
                )}
                <button
                  onClick={saveConfig}
                  disabled={!hasChanges || saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
