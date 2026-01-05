export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            boards: {
                Row: {
                    id: string
                    name: string
                    color: string | null
                    background_url: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    color?: string | null
                    background_url?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    color?: string | null
                    background_url?: string | null
                    created_at?: string
                }
            }
            teams: {
                Row: {
                    id: string
                    name: string
                    initials: string | null
                    color: string | null
                    text_color: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    initials?: string | null
                    color?: string | null
                    text_color?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    initials?: string | null
                    color?: string | null
                    text_color?: string | null
                    created_at?: string
                }
            }
            projects: {
                Row: {
                    id: string
                    name: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    created_at?: string
                }
            }
            workflows: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    steps: Json
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    description?: string | null
                    steps?: Json
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    description?: string | null
                    steps?: Json
                    created_at?: string
                }
            }
            tasks: {
                Row: {
                    id: string
                    task_number: number
                    title: string
                    description: string | null
                    status: string
                    priority: 'LOW' | 'MEDIUM' | 'HIGH'
                    due_date: string | null
                    project_id: string | null
                    client_id: string | null
                    assignee_id: string | null
                    team_id: string | null
                    workflow_id: string | null
                    tags: string[] | null
                    checklist: Json | null
                    attachments: Json | null
                    created_by: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    task_number?: number
                    title: string
                    description?: string | null
                    status?: string
                    priority?: 'LOW' | 'MEDIUM' | 'HIGH'
                    due_date?: string | null
                    project_id?: string | null
                    client_id?: string | null
                    assignee_id?: string | null
                    team_id?: string | null
                    workflow_id?: string | null
                    tags?: string[] | null
                    checklist?: Json | null
                    attachments?: Json | null
                    created_by?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    task_number?: number
                    title?: string
                    description?: string | null
                    status?: string
                    priority?: 'LOW' | 'MEDIUM' | 'HIGH'
                    due_date?: string | null
                    project_id?: string | null
                    client_id?: string | null
                    assignee_id?: string | null
                    team_id?: string | null
                    workflow_id?: string | null
                    tags?: string[] | null
                    checklist?: Json | null
                    attachments?: Json | null
                    created_by?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            task_boards: {
                Row: {
                    task_id: string
                    board_id: string
                    created_at: string
                }
                Insert: {
                    task_id: string
                    board_id: string
                    created_at?: string
                }
                Update: {
                    task_id?: string
                    board_id?: string
                    created_at?: string
                }
            }
        }
    }
}

export type Board = Database['public']['Tables']['boards']['Row'];
export type Project = Database['public']['Tables']['projects']['Row'];
