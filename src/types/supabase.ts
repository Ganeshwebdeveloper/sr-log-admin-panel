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
      drivers: {
        Row: {
          created_at: string
          drv_id: string
          email: string | null
          name: string
          password: string
          phone: string | null
          photo_url: string | null
          status: Database["public"]["Enums"]["driver_status"]
        }
        Insert: {
          created_at?: string
          drv_id: string
          email?: string | null
          name: string
          password: string
          phone?: string | null
          photo_url?: string | null
          status?: Database["public"]["Enums"]["driver_status"]
        }
        Update: {
          created_at?: string
          drv_id?: string
          email?: string | null
          name?: string
          password?: string
          phone?: string | null
          photo_url?: string | null
          status?: Database["public"]["Enums"]["driver_status"]
        }
        Relationships: []
      }
      messages: {
        Row: {
          created_at: string
          file_url: string | null
          id: string
          message: string | null
          sender: string | null
          type: Database["public"]["Enums"]["message_type"]
        }
        Insert: {
          created_at?: string
          file_url?: string | null
          id?: string
          message?: string | null
          sender?: string | null
          type?: Database["public"]["Enums"]["message_type"]
        }
        Update: {
          created_at?: string
          file_url?: string | null
          id?: string
          message?: string | null
          sender?: string | null
          type?: Database["public"]["Enums"]["message_type"]
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          drv_id: string | null
          id: string
          message: string | null
          type: string | null
          vehicle_reg_no: string | null
        }
        Insert: {
          created_at?: string
          drv_id?: string | null
          id?: string
          message?: string | null
          type?: string | null
          vehicle_reg_no?: string | null
        }
        Update: {
          created_at?: string
          drv_id?: string | null
          id?: string
          message?: string | null
          type?: string | null
          vehicle_reg_no?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_drv_id_fkey"
            columns: ["drv_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["drv_id"]
          },
          {
            foreignKeyName: "notifications_vehicle_reg_no_fkey"
            columns: ["vehicle_reg_no"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["reg_no"]
          },
        ]
      }
      settings: {
        Row: {
          created_at: string
          diesel_price_per_litre: number
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          diesel_price_per_litre?: number
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          diesel_price_per_litre?: number
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          avg_speed: number | null
          created_at: string
          current_location: string | null
          destination: string | null
          distance: number | null
          driver_salary: number | null
          drv_id: string | null
          end_time: string | null
          fuel_cost: number | null
          maintenance_cost: number | null
          origin: string | null
          profit: number | null
          start_time: string | null
          status: Database["public"]["Enums"]["trip_status"]
          total_cost: number | null
          trip_id: string
          vehicle_reg_no: string | null
        }
        Insert: {
          avg_speed?: number | null
          created_at?: string
          current_location?: string | null
          destination?: string | null
          distance?: number | null
          driver_salary?: number | null
          drv_id?: string | null
          end_time?: string | null
          fuel_cost?: number | null
          maintenance_cost?: number | null
          origin?: string | null
          profit?: number | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["trip_status"]
          total_cost?: number | null
          trip_id?: string
          vehicle_reg_no?: string | null
        }
        Update: {
          avg_speed?: number | null
          created_at?: string
          current_location?: string | null
          destination?: string | null
          distance?: number | null
          driver_salary?: number | null
          drv_id?: string | null
          end_time?: string | null
          fuel_cost?: number | null
          maintenance_cost?: number | null
          origin?: string | null
          profit?: number | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["trip_status"]
          total_cost?: number | null
          trip_id?: string
          vehicle_reg_no?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_drv_id_fkey"
            columns: ["drv_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["drv_id"]
          },
          {
            foreignKeyName: "trips_vehicle_reg_no_fkey"
            columns: ["vehicle_reg_no"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["reg_no"]
          },
        ]
      }
      vehicles: {
        Row: {
          company: string | null
          condition: string | null
          created_at: string
          mileage: number | null
          model: string | null
          reg_no: string
          status: Database["public"]["Enums"]["vehicle_status"]
          year: number | null
        }
        Insert: {
          company?: string | null
          condition?: string | null
          created_at?: string
          mileage?: number | null
          model?: string | null
          reg_no: string
          status?: Database["public"]["Enums"]["vehicle_status"]
          year?: number | null
        }
        Update: {
          company?: string | null
          condition?: string | null
          created_at?: string
          mileage?: number | null
          model?: string | null
          reg_no?: string
          status?: Database["public"]["Enums"]["vehicle_status"]
          year?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      driver_status: "active" | "inactive"
      message_type: "text" | "image" | "voice"
      trip_status: "pending" | "started" | "finished"
      vehicle_status: "Good" | "Maintenance"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never