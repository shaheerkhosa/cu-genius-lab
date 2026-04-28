export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      assessments: {
        Row: {
          assessment_type: string
          course_code: string
          course_name: string
          created_at: string
          file_path: string | null
          id: string
          is_marks_finalized: boolean
          is_online_quiz: boolean
          schedule_end: string | null
          schedule_start: string | null
          teacher_id: string
          title: string
          total_marks: number
          updated_at: string
        }
        Insert: {
          assessment_type: string
          course_code: string
          course_name: string
          created_at?: string
          file_path?: string | null
          id?: string
          is_marks_finalized?: boolean
          is_online_quiz?: boolean
          schedule_end?: string | null
          schedule_start?: string | null
          teacher_id: string
          title: string
          total_marks?: number
          updated_at?: string
        }
        Update: {
          assessment_type?: string
          course_code?: string
          course_name?: string
          created_at?: string
          file_path?: string | null
          id?: string
          is_marks_finalized?: boolean
          is_online_quiz?: boolean
          schedule_end?: string | null
          schedule_start?: string | null
          teacher_id?: string
          title?: string
          total_marks?: number
          updated_at?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          course_code: string
          created_at: string
          date: string
          id: string
          status: string
          student_id: string
          teacher_id: string
        }
        Insert: {
          course_code: string
          created_at?: string
          date?: string
          id?: string
          status?: string
          student_id: string
          teacher_id: string
        }
        Update: {
          course_code?: string
          created_at?: string
          date?: string
          id?: string
          status?: string
          student_id?: string
          teacher_id?: string
        }
        Relationships: []
      }
      buildings: {
        Row: {
          address: string | null
          code: string
          created_at: string
          description: string | null
          floors: number
          has_elevator: boolean
          has_wheelchair_access: boolean
          id: string
          name: string
          year_built: number | null
        }
        Insert: {
          address?: string | null
          code: string
          created_at?: string
          description?: string | null
          floors: number
          has_elevator?: boolean
          has_wheelchair_access?: boolean
          id?: string
          name: string
          year_built?: number | null
        }
        Update: {
          address?: string | null
          code?: string
          created_at?: string
          description?: string | null
          floors?: number
          has_elevator?: boolean
          has_wheelchair_access?: boolean
          id?: string
          name?: string
          year_built?: number | null
        }
        Relationships: []
      }
      club_members: {
        Row: {
          club_id: string
          id: string
          joined_at: string
          role: string
          student_id: string
        }
        Insert: {
          club_id: string
          id?: string
          joined_at?: string
          role?: string
          student_id: string
        }
        Update: {
          club_id?: string
          id?: string
          joined_at?: string
          role?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_members_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_members_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          category: string
          contact_email: string | null
          description: string
          faculty_advisor_id: string | null
          founded_year: number | null
          id: string
          meeting_day: number | null
          meeting_room_id: string | null
          meeting_time: string | null
          member_count: number
          name: string
        }
        Insert: {
          category: string
          contact_email?: string | null
          description: string
          faculty_advisor_id?: string | null
          founded_year?: number | null
          id?: string
          meeting_day?: number | null
          meeting_room_id?: string | null
          meeting_time?: string | null
          member_count?: number
          name: string
        }
        Update: {
          category?: string
          contact_email?: string | null
          description?: string
          faculty_advisor_id?: string | null
          founded_year?: number | null
          id?: string
          meeting_day?: number | null
          meeting_room_id?: string | null
          meeting_time?: string | null
          member_count?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "clubs_faculty_advisor_id_fkey"
            columns: ["faculty_advisor_id"]
            isOneToOne: false
            referencedRelation: "faculty"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clubs_meeting_room_id_fkey"
            columns: ["meeting_room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          message_count: number | null
          summary: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_count?: number | null
          summary?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_count?: number | null
          summary?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      course_announcements: {
        Row: {
          body: string
          course_code: string
          created_at: string
          id: string
          priority: string
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          course_code: string
          created_at?: string
          id?: string
          priority?: string
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          course_code?: string
          created_at?: string
          id?: string
          priority?: string
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      course_enrollments: {
        Row: {
          course_code: string
          enrolled_at: string
          id: string
          student_id: string
        }
        Insert: {
          course_code: string
          enrolled_at?: string
          id?: string
          student_id: string
        }
        Update: {
          course_code?: string
          enrolled_at?: string
          id?: string
          student_id?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          course_code: string
          course_name: string
          created_at: string | null
          credits: number
          department: string
          id: string
          semester_number: number
        }
        Insert: {
          course_code: string
          course_name: string
          created_at?: string | null
          credits?: number
          department?: string
          id?: string
          semester_number: number
        }
        Update: {
          course_code?: string
          course_name?: string
          created_at?: string | null
          credits?: number
          department?: string
          id?: string
          semester_number?: number
        }
        Relationships: []
      }
      dining_items: {
        Row: {
          allergens: string[]
          calories: number | null
          carbs_g: number | null
          created_at: string
          description: string | null
          fat_g: number | null
          id: string
          menu_id: string
          name: string
          price_cents: number
          protein_g: number | null
          source_fdc_id: number | null
          tags: string[]
        }
        Insert: {
          allergens?: string[]
          calories?: number | null
          carbs_g?: number | null
          created_at?: string
          description?: string | null
          fat_g?: number | null
          id?: string
          menu_id: string
          name: string
          price_cents: number
          protein_g?: number | null
          source_fdc_id?: number | null
          tags?: string[]
        }
        Update: {
          allergens?: string[]
          calories?: number | null
          carbs_g?: number | null
          created_at?: string
          description?: string | null
          fat_g?: number | null
          id?: string
          menu_id?: string
          name?: string
          price_cents?: number
          protein_g?: number | null
          source_fdc_id?: number | null
          tags?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "dining_items_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "dining_menus"
            referencedColumns: ["id"]
          },
        ]
      }
      dining_menus: {
        Row: {
          day_of_week: number
          id: string
          meal_type: string
          outlet_id: string
        }
        Insert: {
          day_of_week: number
          id?: string
          meal_type: string
          outlet_id: string
        }
        Update: {
          day_of_week?: number
          id?: string
          meal_type?: string
          outlet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dining_menus_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "dining_outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      dining_outlets: {
        Row: {
          accepts_meal_plan: boolean
          building_id: string | null
          created_at: string
          cuisine_type: string | null
          description: string | null
          id: string
          name: string
          opening_hours: Json
        }
        Insert: {
          accepts_meal_plan?: boolean
          building_id?: string | null
          created_at?: string
          cuisine_type?: string | null
          description?: string | null
          id?: string
          name: string
          opening_hours?: Json
        }
        Update: {
          accepts_meal_plan?: boolean
          building_id?: string | null
          created_at?: string
          cuisine_type?: string | null
          description?: string | null
          id?: string
          name?: string
          opening_hours?: Json
        }
        Relationships: [
          {
            foreignKeyName: "dining_outlets_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          document_type: string
          file_name: string
          file_path: string
          file_size: number | null
          flagged_at: string | null
          flagged_reason: string | null
          id: string
          mime_type: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          updated_at: string | null
          user_id: string
          verification_details: Json | null
          verification_score: number | null
          verification_status: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          document_type: string
          file_name: string
          file_path: string
          file_size?: number | null
          flagged_at?: string | null
          flagged_reason?: string | null
          id?: string
          mime_type?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          updated_at?: string | null
          user_id: string
          verification_details?: Json | null
          verification_score?: number | null
          verification_status?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          document_type?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          flagged_at?: string | null
          flagged_reason?: string | null
          id?: string
          mime_type?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          updated_at?: string | null
          user_id?: string
          verification_details?: Json | null
          verification_score?: number | null
          verification_status?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          capacity: number | null
          category: string
          created_at: string
          description: string | null
          end_at: string
          id: string
          location_room_id: string | null
          location_text: string | null
          organizer: string | null
          rsvp_required: boolean
          start_at: string
          title: string
        }
        Insert: {
          capacity?: number | null
          category: string
          created_at?: string
          description?: string | null
          end_at: string
          id?: string
          location_room_id?: string | null
          location_text?: string | null
          organizer?: string | null
          rsvp_required?: boolean
          start_at: string
          title: string
        }
        Update: {
          capacity?: number | null
          category?: string
          created_at?: string
          description?: string | null
          end_at?: string
          id?: string
          location_room_id?: string | null
          location_text?: string | null
          organizer?: string | null
          rsvp_required?: boolean
          start_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_location_room_id_fkey"
            columns: ["location_room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      faculty: {
        Row: {
          auth_user_id: string | null
          bio: string | null
          college: string
          created_at: string
          department: string
          email: string
          full_name: string
          id: string
          joined_year: number | null
          office_room_id: string | null
          phone_extension: string | null
          research_areas: string[]
          title: string
        }
        Insert: {
          auth_user_id?: string | null
          bio?: string | null
          college: string
          created_at?: string
          department: string
          email: string
          full_name: string
          id?: string
          joined_year?: number | null
          office_room_id?: string | null
          phone_extension?: string | null
          research_areas?: string[]
          title: string
        }
        Update: {
          auth_user_id?: string | null
          bio?: string | null
          college?: string
          created_at?: string
          department?: string
          email?: string
          full_name?: string
          id?: string
          joined_year?: number | null
          office_room_id?: string | null
          phone_extension?: string | null
          research_areas?: string[]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "faculty_office_fk"
            columns: ["office_room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          document_id: string
          embedding: string | null
          id: string
          token_count: number | null
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string
          document_id: string
          embedding?: string | null
          id?: string
          token_count?: number | null
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          document_id?: string
          embedding?: string | null
          id?: string
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "kb_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "kb_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_documents: {
        Row: {
          body: string
          category: string | null
          created_at: string
          id: string
          metadata: Json
          slug: string
          source: string
          title: string
          url: string | null
        }
        Insert: {
          body: string
          category?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          slug: string
          source: string
          title: string
          url?: string | null
        }
        Update: {
          body?: string
          category?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          slug?: string
          source?: string
          title?: string
          url?: string | null
        }
        Relationships: []
      }
      library_hours: {
        Row: {
          day_of_week: number
          end_time: string
          id: string
          notes: string | null
          start_time: string
        }
        Insert: {
          day_of_week: number
          end_time: string
          id?: string
          notes?: string | null
          start_time: string
        }
        Update: {
          day_of_week?: number
          end_time?: string
          id?: string
          notes?: string | null
          start_time?: string
        }
        Relationships: []
      }
      library_resources: {
        Row: {
          description: string | null
          id: string
          is_reservable: boolean
          location: string | null
          quantity: number
          resource_type: string
          title: string
        }
        Insert: {
          description?: string | null
          id?: string
          is_reservable?: boolean
          location?: string | null
          quantity?: number
          resource_type: string
          title: string
        }
        Update: {
          description?: string | null
          id?: string
          is_reservable?: boolean
          location?: string | null
          quantity?: number
          resource_type?: string
          title?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          document_id: string | null
          id: string
          message: string | null
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          document_id?: string | null
          id?: string
          message?: string | null
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          document_id?: string | null
          id?: string
          message?: string | null
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      office_hours: {
        Row: {
          day_of_week: number
          end_time: string
          faculty_id: string
          id: string
          location_room_id: string | null
          notes: string | null
          start_time: string
        }
        Insert: {
          day_of_week: number
          end_time: string
          faculty_id: string
          id?: string
          location_room_id?: string | null
          notes?: string | null
          start_time: string
        }
        Update: {
          day_of_week?: number
          end_time?: string
          faculty_id?: string
          id?: string
          location_room_id?: string | null
          notes?: string | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "office_hours_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculty"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "office_hours_location_room_id_fkey"
            columns: ["location_room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          username: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          username: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          username?: string
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          assessment_id: string
          completed_at: string | null
          id: string
          score: number | null
          started_at: string
          student_id: string
          total_marks: number | null
        }
        Insert: {
          assessment_id: string
          completed_at?: string | null
          id?: string
          score?: number | null
          started_at?: string
          student_id: string
          total_marks?: number | null
        }
        Update: {
          assessment_id?: string
          completed_at?: string | null
          id?: string
          score?: number | null
          started_at?: string
          student_id?: string
          total_marks?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_proctoring_events: {
        Row: {
          assessment_id: string
          created_at: string
          event_type: string
          id: string
          metadata: Json
          severity: string
          student_id: string
        }
        Insert: {
          assessment_id: string
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          severity?: string
          student_id: string
        }
        Update: {
          assessment_id?: string
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          severity?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_proctoring_events_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          assessment_id: string
          correct_option: string
          created_at: string
          id: string
          marks: number
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_order: number
          question_text: string
        }
        Insert: {
          assessment_id: string
          correct_option: string
          created_at?: string
          id?: string
          marks?: number
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_order?: number
          question_text: string
        }
        Update: {
          assessment_id?: string
          correct_option?: string
          created_at?: string
          id?: string
          marks?: number
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          question_order?: number
          question_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_responses: {
        Row: {
          assessment_id: string
          id: string
          is_correct: boolean | null
          question_id: string
          selected_option: string | null
          student_id: string
          submitted_at: string
        }
        Insert: {
          assessment_id: string
          id?: string
          is_correct?: boolean | null
          question_id: string
          selected_option?: string | null
          student_id: string
          submitted_at?: string
        }
        Update: {
          assessment_id?: string
          id?: string
          is_correct?: boolean | null
          question_id?: string
          selected_option?: string | null
          student_id?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_responses_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          av_equipment: string[]
          building_id: string
          capacity: number | null
          created_at: string
          floor: number
          id: string
          notes: string | null
          room_number: string
          room_type: string
        }
        Insert: {
          av_equipment?: string[]
          building_id: string
          capacity?: number | null
          created_at?: string
          floor: number
          id?: string
          notes?: string | null
          room_number: string
          room_type: string
        }
        Update: {
          av_equipment?: string[]
          building_id?: string
          capacity?: number | null
          created_at?: string
          floor?: number
          id?: string
          notes?: string | null
          room_number?: string
          room_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      student_marks: {
        Row: {
          assessment_id: string
          created_at: string
          id: string
          is_late: boolean
          marks_obtained: number | null
          remarks: string | null
          student_id: string | null
          student_name: string
          student_roll_number: string
          submission_file_path: string | null
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          assessment_id: string
          created_at?: string
          id?: string
          is_late?: boolean
          marks_obtained?: number | null
          remarks?: string | null
          student_id?: string | null
          student_name: string
          student_roll_number: string
          submission_file_path?: string | null
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          assessment_id?: string
          created_at?: string
          id?: string
          is_late?: boolean
          marks_obtained?: number | null
          remarks?: string | null
          student_id?: string | null
          student_name?: string
          student_roll_number?: string
          submission_file_path?: string | null
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_marks_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          auth_user_id: string | null
          college: string
          created_at: string
          date_of_birth: string | null
          department: string
          email: string
          enrollment_year: number
          full_name: string
          gpa: number | null
          hometown: string | null
          id: string
          program: string
          roll_number: string
          year_of_study: number
        }
        Insert: {
          auth_user_id?: string | null
          college: string
          created_at?: string
          date_of_birth?: string | null
          department: string
          email: string
          enrollment_year: number
          full_name: string
          gpa?: number | null
          hometown?: string | null
          id?: string
          program: string
          roll_number: string
          year_of_study: number
        }
        Update: {
          auth_user_id?: string | null
          college?: string
          created_at?: string
          date_of_birth?: string | null
          department?: string
          email?: string
          enrollment_year?: number
          full_name?: string
          gpa?: number | null
          hometown?: string | null
          id?: string
          program?: string
          roll_number?: string
          year_of_study?: number
        }
        Relationships: []
      }
      teacher_courses: {
        Row: {
          course_code: string
          course_name: string
          created_at: string | null
          id: string
          teacher_id: string
        }
        Insert: {
          course_code: string
          course_name: string
          created_at?: string | null
          id?: string
          teacher_id: string
        }
        Update: {
          course_code?: string
          course_name?: string
          created_at?: string | null
          id?: string
          teacher_id?: string
        }
        Relationships: []
      }
      timetable: {
        Row: {
          course_code: string
          course_name: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          room: string | null
          start_time: string
          teacher_id: string | null
        }
        Insert: {
          course_code: string
          course_name: string
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          room?: string | null
          start_time: string
          teacher_id?: string | null
        }
        Update: {
          course_code?: string
          course_name?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          room?: string | null
          start_time?: string
          teacher_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_enrolled_in_course: {
        Args: { _course_code: string; _student_id: string }
        Returns: boolean
      }
      match_kb_chunks: {
        Args: {
          filter_source?: string
          match_count?: number
          query_embedding: string
        }
        Returns: {
          chunk_id: string
          chunk_index: number
          content: string
          document_id: string
          document_slug: string
          document_source: string
          document_title: string
          document_url: string
          similarity: number
        }[]
      }
      submit_assignment: {
        Args: { p_assessment_id: string; p_file_path: string }
        Returns: {
          assessment_id: string
          created_at: string
          id: string
          is_late: boolean
          marks_obtained: number | null
          remarks: string | null
          student_id: string | null
          student_name: string
          student_roll_number: string
          submission_file_path: string | null
          submitted_at: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "student_marks"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
