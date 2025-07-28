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
  results_status: ResultsStatus
  completion_status: boolean
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
  results_status?: ResultsStatus
  completion_status?: boolean
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
  results_status?: ResultsStatus
  completion_status?: boolean
}

export interface CreateRepetitionRequest {
  experiment_id: string
  repetition_number: number
  scheduled_date?: string | null
  schedule_status?: ScheduleStatus
}

export interface UpdateRepetitionRequest {
  scheduled_date?: string | null
  schedule_status?: ScheduleStatus
  completion_status?: boolean
}

// Data Entry System Interfaces
export type PhaseDraftStatus = 'draft' | 'submitted' | 'withdrawn'
export type ExperimentPhase = 'pre-soaking' | 'air-drying' | 'cracking' | 'shelling'

export interface ExperimentPhaseDraft {
  id: string
  experiment_id: string
  repetition_id: string
  user_id: string
  phase_name: ExperimentPhase
  status: PhaseDraftStatus
  draft_name?: string | null
  created_at: string
  updated_at: string
  submitted_at?: string | null
  withdrawn_at?: string | null
}

export interface ExperimentRepetition {
  id: string
  experiment_id: string
  repetition_number: number
  scheduled_date?: string | null
  schedule_status: ScheduleStatus
  completion_status: boolean
  is_locked: boolean
  locked_at?: string | null
  locked_by?: string | null
  created_at: string
  updated_at: string
  created_by: string
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
  phase_draft_id: string
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

export interface CreatePhaseDraftRequest {
  experiment_id: string
  repetition_id: string
  phase_name: ExperimentPhase
  draft_name?: string
  status?: PhaseDraftStatus
}

export interface UpdatePhaseDraftRequest {
  draft_name?: string
  status?: PhaseDraftStatus
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

// Experiment Repetitions Management
export const repetitionManagement = {
  // Get all repetitions for an experiment
  async getExperimentRepetitions(experimentId: string): Promise<ExperimentRepetition[]> {
    const { data, error } = await supabase
      .from('experiment_repetitions')
      .select('*')
      .eq('experiment_id', experimentId)
      .order('repetition_number', { ascending: true })

    if (error) throw error
    return data
  },

  // Create a new repetition
  async createRepetition(repetitionData: CreateRepetitionRequest): Promise<ExperimentRepetition> {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('experiment_repetitions')
      .insert({
        ...repetitionData,
        created_by: user.id
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update a repetition
  async updateRepetition(id: string, updates: UpdateRepetitionRequest): Promise<ExperimentRepetition> {
    const { data, error } = await supabase
      .from('experiment_repetitions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Schedule a repetition
  async scheduleRepetition(id: string, scheduledDate: string): Promise<ExperimentRepetition> {
    const updates: UpdateRepetitionRequest = {
      scheduled_date: scheduledDate,
      schedule_status: 'scheduled'
    }

    return this.updateRepetition(id, updates)
  },

  // Remove repetition schedule
  async removeRepetitionSchedule(id: string): Promise<ExperimentRepetition> {
    const updates: UpdateRepetitionRequest = {
      scheduled_date: null,
      schedule_status: 'pending schedule'
    }

    return this.updateRepetition(id, updates)
  },

  // Delete a repetition
  async deleteRepetition(id: string): Promise<void> {
    const { error } = await supabase
      .from('experiment_repetitions')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Get repetitions by status
  async getRepetitionsByStatus(scheduleStatus?: ScheduleStatus): Promise<ExperimentRepetition[]> {
    let query = supabase.from('experiment_repetitions').select('*')

    if (scheduleStatus) {
      query = query.eq('schedule_status', scheduleStatus)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Get repetitions with experiment details
  async getRepetitionsWithExperiments(): Promise<(ExperimentRepetition & { experiment: Experiment })[]> {
    const { data, error } = await supabase
      .from('experiment_repetitions')
      .select(`
        *,
        experiment:experiments(*)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Create all repetitions for an experiment
  async createAllRepetitions(experimentId: string): Promise<ExperimentRepetition[]> {
    // First get the experiment to know how many reps are required
    const { data: experiment, error: expError } = await supabase
      .from('experiments')
      .select('reps_required')
      .eq('id', experimentId)
      .single()

    if (expError) throw expError

    // Create repetitions for each required rep
    const repetitions: CreateRepetitionRequest[] = []
    for (let i = 1; i <= experiment.reps_required; i++) {
      repetitions.push({
        experiment_id: experimentId,
        repetition_number: i,
        schedule_status: 'pending schedule'
      })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('experiment_repetitions')
      .insert(repetitions.map(rep => ({
        ...rep,
        created_by: user.id
      })))
      .select()

    if (error) throw error
    return data
  },

  // Lock a repetition (admin only)
  async lockRepetition(repetitionId: string): Promise<ExperimentRepetition> {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('experiment_repetitions')
      .update({
        is_locked: true,
        locked_at: new Date().toISOString(),
        locked_by: user.id
      })
      .eq('id', repetitionId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Unlock a repetition (admin only)
  async unlockRepetition(repetitionId: string): Promise<ExperimentRepetition> {
    const { data, error } = await supabase
      .from('experiment_repetitions')
      .update({
        is_locked: false,
        locked_at: null,
        locked_by: null
      })
      .eq('id', repetitionId)
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// Phase Draft Management
export const phaseDraftManagement = {
  // Get all phase drafts for a repetition
  async getPhaseDraftsForRepetition(repetitionId: string): Promise<ExperimentPhaseDraft[]> {
    const { data, error } = await supabase
      .from('experiment_phase_drafts')
      .select('*')
      .eq('repetition_id', repetitionId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Get user's phase drafts for a repetition
  async getUserPhaseDraftsForRepetition(repetitionId: string): Promise<ExperimentPhaseDraft[]> {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('experiment_phase_drafts')
      .select('*')
      .eq('repetition_id', repetitionId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Get user's phase drafts for a specific phase and repetition
  async getUserPhaseDraftsForPhase(repetitionId: string, phase: ExperimentPhase): Promise<ExperimentPhaseDraft[]> {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('experiment_phase_drafts')
      .select('*')
      .eq('repetition_id', repetitionId)
      .eq('user_id', user.id)
      .eq('phase_name', phase)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Create a new phase draft
  async createPhaseDraft(request: CreatePhaseDraftRequest): Promise<ExperimentPhaseDraft> {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('experiment_phase_drafts')
      .insert({
        ...request,
        user_id: user.id
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update a phase draft
  async updatePhaseDraft(id: string, updates: UpdatePhaseDraftRequest): Promise<ExperimentPhaseDraft> {
    const { data, error } = await supabase
      .from('experiment_phase_drafts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete a phase draft (only drafts)
  async deletePhaseDraft(id: string): Promise<void> {
    const { error } = await supabase
      .from('experiment_phase_drafts')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Submit a phase draft (change status from draft to submitted)
  async submitPhaseDraft(id: string): Promise<ExperimentPhaseDraft> {
    return this.updatePhaseDraft(id, { status: 'submitted' })
  },

  // Withdraw a phase draft (change status from submitted to withdrawn)
  async withdrawPhaseDraft(id: string): Promise<ExperimentPhaseDraft> {
    return this.updatePhaseDraft(id, { status: 'withdrawn' })
  },

  // Get phase data for a phase draft
  async getPhaseDataForDraft(phaseDraftId: string): Promise<ExperimentPhaseData | null> {
    const { data, error } = await supabase
      .from('experiment_phase_data')
      .select(`
        *,
        diameter_measurements:pecan_diameter_measurements(*)
      `)
      .eq('phase_draft_id', phaseDraftId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No rows found
      throw error
    }
    return data
  },

  // Create or update phase data for a draft
  async upsertPhaseData(phaseDraftId: string, phaseData: Partial<ExperimentPhaseData>): Promise<ExperimentPhaseData> {
    const { data, error } = await supabase
      .from('experiment_phase_data')
      .upsert({
        phase_draft_id: phaseDraftId,
        ...phaseData
      }, {
        onConflict: 'phase_draft_id,phase_name'
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
  async autoSaveDraft(phaseDraftId: string, phaseData: Partial<ExperimentPhaseData>): Promise<void> {
    try {
      await this.upsertPhaseData(phaseDraftId, phaseData)
    } catch (error) {
      console.warn('Auto-save failed:', error)
      // Don't throw error for auto-save failures
    }
  }
}
