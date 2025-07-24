import { createClient } from '@supabase/supabase-js'

// Local development configuration
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types for TypeScript
export type RoleName = 'admin' | 'conductor' | 'analyst' | 'data recorder'
export type UserStatus = 'active' | 'disabled'
export type ScheduleStatus = 'pending schedule' | 'scheduled' | 'canceled' | 'aborted'
export type ResultsStatus = 'valid' | 'invalid'

export interface User {
  id: string
  email: string
  roles: RoleName[]
  status: UserStatus
  created_at: string
  updated_at: string
}

export interface Role {
  id: string
  name: RoleName
  description: string
  created_at: string
}

export interface Experiment {
  id: string
  experiment_number: number
  reps_required: number
  soaking_duration_hr: number
  air_drying_time_min: number
  plate_contact_frequency_hz: number
  throughput_rate_pecans_sec: number
  crush_amount_in: number
  entry_exit_height_diff_in: number
  schedule_status: ScheduleStatus
  results_status: ResultsStatus
  completion_status: boolean
  scheduled_date?: string | null
  created_at: string
  updated_at: string
  created_by: string
}

export interface CreateExperimentRequest {
  experiment_number: number
  reps_required: number
  soaking_duration_hr: number
  air_drying_time_min: number
  plate_contact_frequency_hz: number
  throughput_rate_pecans_sec: number
  crush_amount_in: number
  entry_exit_height_diff_in: number
  schedule_status?: ScheduleStatus
  results_status?: ResultsStatus
  completion_status?: boolean
  scheduled_date?: string | null
}

export interface UpdateExperimentRequest {
  experiment_number?: number
  reps_required?: number
  soaking_duration_hr?: number
  air_drying_time_min?: number
  plate_contact_frequency_hz?: number
  throughput_rate_pecans_sec?: number
  crush_amount_in?: number
  entry_exit_height_diff_in?: number
  schedule_status?: ScheduleStatus
  results_status?: ResultsStatus
  completion_status?: boolean
  scheduled_date?: string | null
}

// Data Entry System Interfaces
export type DataEntryStatus = 'draft' | 'submitted'
export type ExperimentPhase = 'pre-soaking' | 'air-drying' | 'cracking' | 'shelling'

export interface ExperimentDataEntry {
  id: string
  experiment_id: string
  user_id: string
  status: DataEntryStatus
  entry_name?: string | null
  created_at: string
  updated_at: string
  submitted_at?: string | null
}

export interface PecanDiameterMeasurement {
  id: string
  phase_data_id: string
  measurement_number: number
  diameter_in: number
  created_at: string
}

export interface ExperimentPhaseData {
  id: string
  data_entry_id: string
  phase_name: ExperimentPhase

  // Pre-soaking phase
  batch_initial_weight_lbs?: number | null
  initial_shell_moisture_pct?: number | null
  initial_kernel_moisture_pct?: number | null
  soaking_start_time?: string | null

  // Air-drying phase
  airdrying_start_time?: string | null
  post_soak_weight_lbs?: number | null
  post_soak_kernel_moisture_pct?: number | null
  post_soak_shell_moisture_pct?: number | null
  avg_pecan_diameter_in?: number | null

  // Cracking phase
  cracking_start_time?: string | null

  // Shelling phase
  shelling_start_time?: string | null
  bin_1_weight_lbs?: number | null
  bin_2_weight_lbs?: number | null
  bin_3_weight_lbs?: number | null
  discharge_bin_weight_lbs?: number | null
  bin_1_full_yield_oz?: number | null
  bin_2_full_yield_oz?: number | null
  bin_3_full_yield_oz?: number | null
  bin_1_half_yield_oz?: number | null
  bin_2_half_yield_oz?: number | null
  bin_3_half_yield_oz?: number | null

  created_at: string
  updated_at: string

  // Related data
  diameter_measurements?: PecanDiameterMeasurement[]
}

export interface CreateDataEntryRequest {
  experiment_id: string
  entry_name?: string
  status?: DataEntryStatus
}

export interface UpdateDataEntryRequest {
  entry_name?: string
  status?: DataEntryStatus
}

export interface CreatePhaseDataRequest {
  data_entry_id: string
  phase_name: ExperimentPhase
  [key: string]: any // For phase-specific data fields
}

export interface UpdatePhaseDataRequest {
  [key: string]: any // For phase-specific data fields
}

export interface UserRole {
  id: string
  user_id: string
  role_id: string
  assigned_at: string
  assigned_by?: string
}

export interface UserProfile {
  id: string
  email: string
  status: UserStatus
  created_at: string
  updated_at: string
  role_id?: string // Legacy field, will be deprecated
}

export interface CreateUserRequest {
  email: string
  roles: RoleName[]
  tempPassword?: string
}

export interface CreateUserResponse {
  user_id: string
  email: string
  temp_password: string
  roles: RoleName[]
  status: UserStatus
}

// User management utility functions
export const userManagement = {
  // Get all users with their roles
  async getAllUsers(): Promise<User[]> {
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select(`
        id,
        email,
        status,
        created_at,
        updated_at
      `)

    if (profilesError) throw profilesError

    // Get roles for each user
    const usersWithRoles = await Promise.all(
      profiles.map(async (profile) => {
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select(`
            roles!inner (
              name
            )
          `)
          .eq('user_id', profile.id)

        if (rolesError) throw rolesError

        return {
          ...profile,
          roles: userRoles.map(ur => (ur.roles as any).name as RoleName)
        }
      })
    )

    return usersWithRoles
  },

  // Get all available roles
  async getAllRoles(): Promise<Role[]> {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('name')

    if (error) throw error
    return data
  },

  // Create a new user with roles
  async createUser(userData: CreateUserRequest): Promise<CreateUserResponse> {
    const { data, error } = await supabase.rpc('create_user_with_roles', {
      user_email: userData.email,
      role_names: userData.roles,
      temp_password: userData.tempPassword
    })

    if (error) throw error
    return data
  },

  // Update user status (enable/disable)
  async updateUserStatus(userId: string, status: UserStatus): Promise<void> {
    const { error } = await supabase
      .from('user_profiles')
      .update({ status })
      .eq('id', userId)

    if (error) throw error
  },

  // Update user roles
  async updateUserRoles(userId: string, roleNames: RoleName[]): Promise<void> {
    // First, remove all existing roles for the user
    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)

    if (deleteError) throw deleteError

    // Get role IDs for the new roles
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('id, name')
      .in('name', roleNames)

    if (rolesError) throw rolesError

    // Insert new role assignments
    const roleAssignments = roles.map(role => ({
      user_id: userId,
      role_id: role.id
    }))

    const { error: insertError } = await supabase
      .from('user_roles')
      .insert(roleAssignments)

    if (insertError) throw insertError
  },

  // Update user email
  async updateUserEmail(userId: string, email: string): Promise<void> {
    const { error } = await supabase
      .from('user_profiles')
      .update({ email })
      .eq('id', userId)

    if (error) throw error
  },

  // Get current user with roles
  async getCurrentUser(): Promise<User | null> {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser) return null

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select(`
        id,
        email,
        status,
        created_at,
        updated_at
      `)
      .eq('id', authUser.id)
      .single()

    if (profileError) throw profileError

    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select(`
        roles!inner (
          name
        )
      `)
      .eq('user_id', authUser.id)

    if (rolesError) throw rolesError

    return {
      ...profile,
      roles: userRoles.map(ur => (ur.roles as any).name as RoleName)
    }
  }
}

// Experiment management utility functions
export const experimentManagement = {
  // Get all experiments
  async getAllExperiments(): Promise<Experiment[]> {
    const { data, error } = await supabase
      .from('experiments')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Get experiment by ID
  async getExperimentById(id: string): Promise<Experiment | null> {
    const { data, error } = await supabase
      .from('experiments')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data
  },

  // Create a new experiment
  async createExperiment(experimentData: CreateExperimentRequest): Promise<Experiment> {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('experiments')
      .insert({
        ...experimentData,
        created_by: user.id
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update an experiment
  async updateExperiment(id: string, updates: UpdateExperimentRequest): Promise<Experiment> {
    const { data, error } = await supabase
      .from('experiments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete an experiment (admin only)
  async deleteExperiment(id: string): Promise<void> {
    const { error } = await supabase
      .from('experiments')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Update experiment status
  async updateExperimentStatus(id: string, scheduleStatus?: ScheduleStatus, resultsStatus?: ResultsStatus): Promise<Experiment> {
    const updates: Partial<UpdateExperimentRequest> = {}
    if (scheduleStatus) updates.schedule_status = scheduleStatus
    if (resultsStatus) updates.results_status = resultsStatus

    return this.updateExperiment(id, updates)
  },

  // Get experiments by status
  async getExperimentsByStatus(scheduleStatus?: ScheduleStatus, resultsStatus?: ResultsStatus): Promise<Experiment[]> {
    let query = supabase.from('experiments').select('*')

    if (scheduleStatus) {
      query = query.eq('schedule_status', scheduleStatus)
    }
    if (resultsStatus) {
      query = query.eq('results_status', resultsStatus)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Schedule an experiment
  async scheduleExperiment(id: string, scheduledDate: string): Promise<Experiment> {
    const updates: UpdateExperimentRequest = {
      scheduled_date: scheduledDate,
      schedule_status: 'scheduled'
    }

    return this.updateExperiment(id, updates)
  },

  // Remove experiment schedule
  async removeExperimentSchedule(id: string): Promise<Experiment> {
    const updates: UpdateExperimentRequest = {
      scheduled_date: null,
      schedule_status: 'pending schedule'
    }

    return this.updateExperiment(id, updates)
  },

  // Check if experiment number is unique
  async isExperimentNumberUnique(experimentNumber: number, excludeId?: string): Promise<boolean> {
    let query = supabase
      .from('experiments')
      .select('id')
      .eq('experiment_number', experimentNumber)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query

    if (error) throw error
    return data.length === 0
  }
}

// Data Entry Management
export const dataEntryManagement = {
  // Get all data entries for an experiment
  async getDataEntriesForExperiment(experimentId: string): Promise<ExperimentDataEntry[]> {
    const { data, error } = await supabase
      .from('experiment_data_entries')
      .select('*')
      .eq('experiment_id', experimentId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Get user's data entries for an experiment
  async getUserDataEntriesForExperiment(experimentId: string, userId?: string): Promise<ExperimentDataEntry[]> {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('User not authenticated')

    const targetUserId = userId || user.id

    const { data, error } = await supabase
      .from('experiment_data_entries')
      .select('*')
      .eq('experiment_id', experimentId)
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Create a new data entry
  async createDataEntry(request: CreateDataEntryRequest): Promise<ExperimentDataEntry> {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('experiment_data_entries')
      .insert({
        ...request,
        user_id: user.id
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update a data entry
  async updateDataEntry(id: string, updates: UpdateDataEntryRequest): Promise<ExperimentDataEntry> {
    const { data, error } = await supabase
      .from('experiment_data_entries')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete a data entry (only drafts)
  async deleteDataEntry(id: string): Promise<void> {
    const { error } = await supabase
      .from('experiment_data_entries')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Submit a data entry (change status from draft to submitted)
  async submitDataEntry(id: string): Promise<ExperimentDataEntry> {
    return this.updateDataEntry(id, { status: 'submitted' })
  },

  // Get phase data for a data entry
  async getPhaseDataForEntry(dataEntryId: string): Promise<ExperimentPhaseData[]> {
    const { data, error } = await supabase
      .from('experiment_phase_data')
      .select(`
        *,
        diameter_measurements:pecan_diameter_measurements(*)
      `)
      .eq('data_entry_id', dataEntryId)
      .order('phase_name')

    if (error) throw error
    return data
  },

  // Get specific phase data
  async getPhaseData(dataEntryId: string, phaseName: ExperimentPhase): Promise<ExperimentPhaseData | null> {
    const { data, error } = await supabase
      .from('experiment_phase_data')
      .select(`
        *,
        diameter_measurements:pecan_diameter_measurements(*)
      `)
      .eq('data_entry_id', dataEntryId)
      .eq('phase_name', phaseName)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data
  },

  // Create or update phase data
  async upsertPhaseData(dataEntryId: string, phaseName: ExperimentPhase, phaseData: Partial<ExperimentPhaseData>): Promise<ExperimentPhaseData> {
    const { data, error } = await supabase
      .from('experiment_phase_data')
      .upsert({
        data_entry_id: dataEntryId,
        phase_name: phaseName,
        ...phaseData
      }, {
        onConflict: 'data_entry_id,phase_name'
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Save diameter measurements
  async saveDiameterMeasurements(phaseDataId: string, measurements: number[]): Promise<PecanDiameterMeasurement[]> {
    // First, delete existing measurements
    await supabase
      .from('pecan_diameter_measurements')
      .delete()
      .eq('phase_data_id', phaseDataId)

    // Then insert new measurements
    const measurementData = measurements.map((diameter, index) => ({
      phase_data_id: phaseDataId,
      measurement_number: index + 1,
      diameter_in: diameter
    }))

    const { data, error } = await supabase
      .from('pecan_diameter_measurements')
      .insert(measurementData)
      .select()

    if (error) throw error
    return data
  },

  // Calculate average diameter from measurements
  calculateAverageDiameter(measurements: number[]): number {
    if (measurements.length === 0) return 0
    const validMeasurements = measurements.filter(m => m > 0)
    if (validMeasurements.length === 0) return 0
    return validMeasurements.reduce((sum, m) => sum + m, 0) / validMeasurements.length
  },

  // Auto-save draft data (for periodic saves)
  async autoSaveDraft(dataEntryId: string, phaseName: ExperimentPhase, phaseData: Partial<ExperimentPhaseData>): Promise<void> {
    try {
      await this.upsertPhaseData(dataEntryId, phaseName, phaseData)
    } catch (error) {
      console.warn('Auto-save failed:', error)
      // Don't throw error for auto-save failures
    }
  }
}
